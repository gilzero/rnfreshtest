import { useContext } from 'react'
import { ThemeContext, AppContext } from '../context'
import { MODELS } from '../../constants'
import { View, Text, StyleSheet, TouchableHighlight, Alert, Platform } from 'react-native'
import { Model, IThemeContext } from '../../types'

interface ChatModelModalProps {
  handlePresentModalPress: () => void;
}

export function ChatModelModal({ handlePresentModalPress }: ChatModelModalProps) {
  const { theme } = useContext(ThemeContext)
  const { setChatType, chatType, clearChatRef } = useContext(AppContext)
  const styles = getStyles(theme)
  const options = Object.values(MODELS)

  function _setChatType(newModel: Model) {
    // Don't show dialog if selecting the same model
    if (newModel.label === chatType.label) {
      handlePresentModalPress()
      return
    }

    // Add emoji icons for better visual cues
    // Using emojis instead of IconComponent because Alert doesn't support custom components
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
            handlePresentModalPress()
          }
        },
        {
          text: '💬 Continue Chat',
          style: 'default',
          onPress: () => {
            setChatType(newModel)
            handlePresentModalPress()
          }
        }
      ],
      { cancelable: true }
    )
  }

  return (
    <View style={styles.bottomSheetContainer}>
      <View>
        <View style={styles.chatOptionsTextContainer}>
          <Text style={styles.chatOptionsText}>
            Language Models
          </Text>
        </View>
        {
          options.map((option, index) => (
            <TouchableHighlight
              underlayColor={'transparent'}
              onPress={() => _setChatType(option)}
              key={index}>
              <View style={optionContainer(theme, chatType.label, option.label)}>
                <option.icon
                 size={20}
                 theme={theme}
                 selected={chatType.label === option.label}
                />
                <Text style={optionText(theme, chatType.label, option.label)}>
                  {option.displayName}
                </Text>
              </View>
            </TouchableHighlight>
          ))
        }
      </View>
    </View>
  )
}

function getStyles(theme: IThemeContext['theme']) {
  return StyleSheet.create({
    closeIconContainer: {
      position: 'absolute',
      right: 3,
      top: 3,
    },
    chatOptionsTextContainer: {
      flexDirection: 'row',
      justifyContent:'center',
    },
    logo: {
      width: 22, height: 17,
      marginRight: 10
    },
    chatOptionsText: {
      color: theme.textColor,
      marginBottom: 22,
      textAlign: 'center',
      fontSize: 16,
      fontFamily: theme.semiBoldFont,
      marginLeft: 10
    },
    bottomSheetContainer: {
      borderColor: theme.borderColor,
      borderWidth: 1,
      padding: 24,
      justifyContent: 'center',
      backgroundColor: theme.backgroundColor,
      marginHorizontal: 14,
      marginBottom: 24,
      borderRadius: 20
    }
  })
}

function optionContainer(theme: IThemeContext['theme'], baseType: string, type: string) {
  const selected = baseType === type
  return {
    backgroundColor: selected ? theme.tintColor : theme.backgroundColor,
    padding: 12,
    borderRadius: 8,
    marginBottom: 9,
    flexDirection: 'row' as 'row',
    justifyContent: 'center' as 'center',
    alignItems: 'center' as 'center',
  }
}

function optionText(theme: IThemeContext['theme'], baseType: string, type: string) {
  const selected = baseType === type
  return {
    color: selected ? theme.tintTextColor : theme.textColor,
    fontFamily: theme.boldFont,
    fontSize: 15,
    shadowColor: 'rgba(0, 0, 0, .2)',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 2,
    marginLeft: 5
  }
}