/**
 * @fileoverview Settings screen component that allows users to select and configure AI chat models.
 * Provides a UI for switching between different AI providers (GPT, Claude, Gemini) and manages model selection state.
 */

import {
  View,
  Text,
  StyleSheet,
  TouchableHighlight,
  ScrollView,
  Alert,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Animated,
  Switch,
  TouchableOpacity
} from 'react-native'
import React, { useContext, useState, useRef, useCallback } from 'react'
import { AppContext, ThemeContext } from '../context'
import {
  AnthropicIcon,
  OpenAIIcon,
  GeminiIcon
} from '../components/index'
import { IIconProps, IThemeContext } from '../../types'
import { MODELS } from '../../constants'
import { lightTheme, darkTheme, miami, hackerNews, vercel } from '../theme'
import Slider from '@react-native-community/slider'
import * as Haptics from 'expo-haptics'
import Ionicons from '@expo/vector-icons/Ionicons'

/** Array of available AI models from constants */
const models = Object.values(MODELS)
const themes = [
  { name: 'Light', theme: lightTheme },
  { name: 'Dark', theme: darkTheme },
  { name: 'Miami', theme: miami },
  { name: 'Hacker News', theme: hackerNews },
  { name: 'Vercel', theme: vercel }
]

type DynamicStyleProps = {
  baseType: string;
  type: string;
  theme: IThemeContext['theme'];
}

type StyleObject = {
  color?: string;
  backgroundColor?: string;
}

type SettingsStyles = {
  container: any;
  contentContainer: any;
  sectionContainer: any;
  sectionTitle: any;
  buttonContainer: any;
  chatChoiceButton: any;
  chatTypeText: any;
  sectionDivider: any;
  settingRow: any;
  settingLabel: any;
  settingDescription: any;
  slider: any;
  switchRow: any;
  hiddenSectionTitle: any;
  hiddenSettingLabel: any;
  hiddenSettingDescription: any;
  hiddenSectionDivider: any;
  hiddenSectionHeader: any;
  hiddenSectionToggle: any;
  hiddenSectionContainer: any;
  switchTextContainer: any;
}

/**
 * Settings component that provides model selection interface.
 * Allows users to switch between different AI providers and displays current selection.
 * @component
 */
export function Settings() {
  const { theme, setTheme } = useContext(ThemeContext)
  const { chatType, setChatType, clearChatRef } = useContext(AppContext)
  const styles = getStyles(theme) as SettingsStyles
  const [showHiddenSettings, setShowHiddenSettings] = useState(false)
  const [temperature, setTemperature] = useState(0.7)
  const [maxTokens, setMaxTokens] = useState(2000)
  const [streamResponse, setStreamResponse] = useState(true)
  const [systemPromptEnabled, setSystemPromptEnabled] = useState(false)
  const pullDistance = useRef(new Animated.Value(0)).current
  const fadeAnim = useRef(new Animated.Value(0)).current
  const rotateAnim = useRef(new Animated.Value(0)).current
  const lastPullY = useRef(0)
  const pullThreshold = 80 // Reduced threshold for better UX

  const currentThemeName = themes.find(t => t.theme === theme)?.name || 'Light'

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = event.nativeEvent.contentOffset.y
    
    // Only track pulls when at the top of the scroll view
    if (y <= 0) {
      const pull = Math.abs(y)
      pullDistance.setValue(pull)
      lastPullY.current = pull
      
      // Show hidden settings if pulled down more than threshold
      if (pull > pullThreshold && !showHiddenSettings) {
        setShowHiddenSettings(true)
        // Provide haptic feedback
        Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        )
        // Start fade-in and rotate animations
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          })
        ]).start()
      }
    }
  }, [showHiddenSettings, fadeAnim, rotateAnim])

  const handleScrollEnd = useCallback(() => {
    // Smoother spring animation
    Animated.spring(pullDistance, {
      toValue: 0,
      useNativeDriver: true,
      tension: 30,
      friction: 7
    }).start()
  }, [pullDistance])

  const toggleHiddenSettings = useCallback(() => {
    setShowHiddenSettings(prev => !prev)
    // Provide haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    // Animate fade and rotation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: showHiddenSettings ? 0 : 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: showHiddenSettings ? 0 : 1,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start()
  }, [showHiddenSettings, fadeAnim, rotateAnim])

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg']
  })

  /**
   * Handles chat model selection with confirmation dialog
   * @param newModel - The selected chat model
   */
  function handleModelSelect(newModel: typeof MODELS[keyof typeof MODELS]) {
    // Don't show dialog if selecting the same model
    if (newModel.label === chatType.label) {
      return
    }

    Alert.alert(
      'Switch to ' + newModel.displayName,
      'Would you like to continue with the current conversation or start a new one?',
      [
        {
          text: '✕ Cancel',
          style: 'cancel'
        },
        {
          text: '🗑️ New Conversation',
          style: 'destructive',
          onPress: () => {
            setChatType(newModel)
            if (clearChatRef.current) {
              clearChatRef.current()
            }
          }
        },
        {
          text: '💬 Continue Chat',
          style: 'default',
          onPress: () => {
            setChatType(newModel)
          }
        }
      ],
      { cancelable: true }
    )
  }

  /**
   * Renders the appropriate icon component based on the AI model type
   * @param {IIconProps} props - Icon properties including type and style props
   * @returns {React.ReactElement} The corresponding icon component for the AI model
   */
  function renderIcon({ type, props }: IIconProps): React.ReactElement | null {
    const iconProps = {
      size: props['size'] as number,
      theme: props['theme'],
      selected: props['selected'] as boolean
    }
    
    if (type.includes('gpt')) {
      return <OpenAIIcon {...iconProps} />
    }
    if (type.includes('claude')) {
      return <AnthropicIcon {...iconProps} />
    }
    if (type.includes('gemini')) {
      return <GeminiIcon {...iconProps} />
    }
    return null; // Default return for unknown types
  }

  return (
    <ScrollView
      style={styles['container']}
      contentContainerStyle={styles['contentContainer']}
      onScroll={handleScroll}
      onScrollEndDrag={handleScrollEnd}
      scrollEventThrottle={16}
    >
      {showHiddenSettings && (
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={styles['hiddenSectionContainer']}>
            <View style={styles['hiddenSectionHeader']}>
              <Text style={styles['hiddenSectionTitle']}>Advanced Settings</Text>
              <TouchableOpacity
                onPress={toggleHiddenSettings}
                style={styles['hiddenSectionToggle']}
              >
                <Animated.View style={{ transform: [{ rotate: spin }] }}>
                  <Ionicons
                    name="chevron-up"
                    size={24}
                    color={theme.textColor + '90'}
                  />
                </Animated.View>
              </TouchableOpacity>
            </View>
            
            <View style={styles['settingRow']}>
              <Text style={styles['hiddenSettingLabel']}>Temperature: {temperature.toFixed(2)}</Text>
              <Text style={styles['hiddenSettingDescription']}>
                Controls randomness: Lower values make responses more focused and deterministic, higher values make them more creative and varied.
              </Text>
              <Slider
                style={styles['slider']}
                minimumValue={0}
                maximumValue={1}
                value={temperature}
                onValueChange={setTemperature}
                minimumTrackTintColor={theme.tintColor + '90'}
                maximumTrackTintColor={theme.borderColor + '60'}
                thumbTintColor={theme.tintColor + '90'}
              />
            </View>

            <View style={styles['settingRow']}>
              <Text style={styles['hiddenSettingLabel']}>Max Tokens: {maxTokens}</Text>
              <Text style={styles['hiddenSettingDescription']}>
                Maximum length of the model's response. Higher values allow for longer responses but may increase latency.
              </Text>
              <Slider
                style={styles['slider']}
                minimumValue={100}
                maximumValue={4000}
                step={100}
                value={maxTokens}
                onValueChange={setMaxTokens}
                minimumTrackTintColor={theme.tintColor + '90'}
                maximumTrackTintColor={theme.borderColor + '60'}
                thumbTintColor={theme.tintColor + '90'}
              />
            </View>

            <View style={styles['switchRow']}>
              <View style={styles['switchTextContainer']}>
                <Text style={styles['hiddenSettingLabel']}>Stream Response</Text>
                <Text style={styles['hiddenSettingDescription']}>
                  Show the response as it's being generated. Disable for faster complete responses.
                </Text>
              </View>
              <Switch
                value={streamResponse}
                onValueChange={setStreamResponse}
                trackColor={{ false: theme.borderColor + '60', true: theme.tintColor + '90' }}
                thumbColor={theme.backgroundColor}
              />
            </View>

            <View style={styles['switchRow']}>
              <View style={styles['switchTextContainer']}>
                <Text style={styles['hiddenSettingLabel']}>System Prompt</Text>
                <Text style={styles['hiddenSettingDescription']}>
                  Enable custom system-level instructions to guide the model's behavior.
                </Text>
              </View>
              <Switch
                value={systemPromptEnabled}
                onValueChange={setSystemPromptEnabled}
                trackColor={{ false: theme.borderColor + '60', true: theme.tintColor + '90' }}
                thumbColor={theme.backgroundColor}
              />
            </View>
          </View>
          <View style={[styles['sectionDivider'], styles['hiddenSectionDivider']]} />
        </Animated.View>
      )}

      <View style={styles['sectionContainer']}>
        <Text style={styles['sectionTitle']}>Chat Model</Text>
        <View style={styles['buttonContainer']}>
          {models.map((model, index) => {
            return (
              <TouchableHighlight
                key={index}
                underlayColor='transparent'
                onPress={() => handleModelSelect(model)}
              >
                <View
                  style={{...styles['chatChoiceButton'], ...getDynamicViewStyle({ baseType: chatType.label, type: model.label, theme } as DynamicStyleProps)}}
                >
                  {renderIcon({
                    type: model.label,
                    props: {
                      theme,
                      size: 18,
                      style: {marginRight: 8},
                      selected: chatType.label === model.label
                    }
                  })}
                  <Text
                    style={{...styles['chatTypeText'], ...getDynamicTextStyle({ baseType: chatType.label, type: model.label, theme } as DynamicStyleProps)}}
                  >
                    {model.displayName}
                  </Text>
                </View>
              </TouchableHighlight>
            )
          })}
        </View>
      </View>

      <View style={styles['sectionDivider']} />

      <View style={styles['sectionContainer']}>
        <Text style={styles['sectionTitle']}>Theme</Text>
        <View style={styles['buttonContainer']}>
          {themes.map((themeOption, index) => (
            <TouchableHighlight
              key={index}
              underlayColor='transparent'
              onPress={() => setTheme(themeOption.theme)}
            >
              <View
                style={{
                  ...styles['chatChoiceButton'],
                  ...getDynamicViewStyle({ 
                    baseType: currentThemeName, 
                    type: themeOption.name, 
                    theme 
                  } as DynamicStyleProps)
                }}
              >
                <Text
                  style={{
                    ...styles['chatTypeText'],
                    ...getDynamicTextStyle({ 
                      baseType: currentThemeName, 
                      type: themeOption.name, 
                      theme 
                    } as DynamicStyleProps)
                  }}
                >
                  {themeOption.name}
                </Text>
              </View>
            </TouchableHighlight>
          ))}
        </View>
      </View>
    </ScrollView>
  )
}

/**
 * Generates dynamic text styles based on selection state
 * @param {DynamicStyleProps} props - Object containing baseType, type, and theme
 * @returns {object} Dynamic text style object
 */
function getDynamicTextStyle({ baseType, type, theme }: DynamicStyleProps): StyleObject {
  if (type === baseType) {
    return {
      color: theme.tintTextColor,
    }
  } else return {}
}

/**
 * Generates dynamic view styles based on selection state
 * @param {DynamicStyleProps} props - Object containing baseType, type, and theme
 * @returns {object} Dynamic view style object
 */
function getDynamicViewStyle({ baseType, type, theme }: DynamicStyleProps): StyleObject {
  if (type === baseType) {
    return {
      backgroundColor: theme.tintColor
    }
  } else return {}
}

/**
 * Generates component styles based on current theme
 * @param {IThemeContext['theme']} theme - Current theme object containing colors and fonts
 * @returns {StyleSheet} StyleSheet object with component styles
 */
const getStyles = (theme: IThemeContext['theme']): ReturnType<typeof StyleSheet.create> => StyleSheet.create({
  contentContainer: {
    paddingBottom: 50
  },
  container: {
    flex: 1,
    backgroundColor: theme.backgroundColor
  },
  sectionContainer: {
    paddingTop: 25,
    paddingBottom: 15
  },
  sectionTitle: {
    color: theme.textColor,
    fontSize: 18,
    fontFamily: theme.boldFont,
    marginBottom: 14,
    paddingHorizontal: 14
  },
  sectionDivider: {
    height: 2,
    backgroundColor: theme.borderColor + '5',
    marginVertical: 5
  },
  chatChoiceButton: {
    flexDirection: 'row',
    marginHorizontal: 14,
    marginBottom: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.borderColor,
    alignItems: 'center',
    gap: 12
  },
  chatTypeText: {
    color: theme.textColor,
    fontSize: 16,
    fontFamily: theme.mediumFont
  },
  buttonContainer: {
    marginBottom: 15
  },
  settingRow: {
    marginBottom: 25
  },
  settingLabel: {
    color: theme.textColor,
    fontSize: 16,
    fontFamily: theme.mediumFont,
    marginBottom: 4
  },
  settingDescription: {
    color: theme.textColor + '80',
    fontSize: 14,
    fontFamily: theme.regularFont,
    marginBottom: 12,
    lineHeight: 20
  },
  slider: {
    width: '100%',
    height: 40,
    marginTop: 8
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 25,
    gap: 20
  },
  switchTextContainer: {
    flex: 1,
  },
  hiddenSectionContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: theme.backgroundColor,
  },
  hiddenSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  hiddenSectionTitle: {
    color: theme.textColor + '90',
    fontSize: 17,
    fontFamily: theme.mediumFont,
    fontStyle: 'italic'
  },
  hiddenSectionToggle: {
    padding: 8,
    marginRight: -8,
  },
  hiddenSettingLabel: {
    color: theme.textColor + '90',
    fontSize: 15,
    fontFamily: theme.mediumFont,
    marginBottom: 6,
    fontStyle: 'italic'
  },
  hiddenSettingDescription: {
    color: theme.textColor + '70',
    fontSize: 13,
    fontFamily: theme.regularFont,
    marginBottom: 12,
    lineHeight: 18
  },
  hiddenSectionDivider: {
    height: 1,
    backgroundColor: theme.borderColor + '30',
    marginVertical: 8
  }
})