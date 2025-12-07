import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Send, MessageCircle, Trash2, Globe } from 'lucide-react-native';
import { useChatStore, ChatMessage } from '../../store/chatStore';
import { useShopContextStore } from '../../store/shopContextStore';
import { getAIResponse, detectLanguage } from '../../utils/aiAssistant';
import { preventDoubleTap } from '../../utils/performance';
import {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
} from '../../utils/theme';

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';

const QUICK_ACTIONS = [
  { id: 'sales', label: { en: 'Today Sales', hi: 'आज की बिक्री', kn: 'ಇಂದಿನ ಮಾರಾಟ' }, query: { en: 'How much did I sell today?', hi: 'आज की बिक्री क्या है?', kn: 'ಇಂದು ಎಷ್ಟು ಮಾರಾಟವಾಯಿತು?' } },
  { id: 'lowstock', label: { en: 'Low Stock', hi: 'कम स्टॉक', kn: 'ಕಡಿಮೆ ಸ್ಟಾಕ್' }, query: { en: 'What is low in stock?', hi: 'कम स्टॉक क्या है?', kn: 'ಕಡಿಮೆ ಸ್ಟಾಕ್ ಯಾವುದು?' } },
  { id: 'expiry', label: { en: 'Expiring Soon', hi: 'एक्सपायरी आ रही', kn: 'ಅವಧಿ ಮುಗಿಯುತ್ತಿದೆ' }, query: { en: 'What is expiring soon?', hi: 'एक्सपायरी क्या आ रही है?', kn: 'ಯಾವುದು ಅವಧಿ ಮುಗಿಯುತ್ತಿದೆ?' } },
  { id: 'top', label: { en: 'Top Selling', hi: 'टॉप सेलिंग', kn: 'ಹೆಚ್ಚು ಮಾರಾಟ' }, query: { en: 'What are my top sellers?', hi: 'टॉप सेलिंग क्या है?', kn: 'ಹೆಚ್ಚು ಮಾರಾಟವಾಗುವುದು ಯಾವುದು?' } },
  { id: 'reorder', label: { en: 'What to Order', hi: 'क्या ऑर्डर करूं', kn: 'ಏನು ಆರ್ಡರ್ ಮಾಡಲಿ' }, query: { en: 'What should I reorder?', hi: 'मुझे क्या ऑर्डर करना चाहिए?', kn: 'ನಾನು ಏನು ಆರ್ಡರ್ ಮಾಡಬೇಕು?' } },
];

export default function ChatScreen() {
  const messages = useChatStore((state) => state.messages);
  const addMessage = useChatStore((state) => state.addMessage);
  const clearMessages = useChatStore((state) => state.clearMessages);
  const shopContext = useShopContextStore((state) => state.context);

  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'hi' | 'kn'>(shopContext.primaryLanguage);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const handleSend = preventDoubleTap(async (text?: string) => {
    const messageText = text || inputText.trim();
    if (!messageText || isLoading) return;

    if (!OPENAI_API_KEY) {
      Alert.alert('Error', 'OpenAI API key not configured. Please add EXPO_PUBLIC_OPENAI_API_KEY to your .env file.');
      return;
    }

    // Detect language
    const detectedLang = detectLanguage(messageText);
    const replyLang = detectedLang !== 'en' ? detectedLang : selectedLanguage;

    // Add user message
    addMessage({
      role: 'user',
      content: messageText,
      language: replyLang,
    });

    setInputText('');
    setIsLoading(true);

    try {
      // Build conversation history
      const conversationHistory = messages.slice(-10).map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // Get AI response
      const response = await getAIResponse(messageText, conversationHistory, OPENAI_API_KEY);

      // Add assistant message
      addMessage({
        role: 'assistant',
        content: response,
        language: replyLang,
      });
    } catch (error) {
      console.error('Chat error:', error);
      addMessage({
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        language: replyLang,
      });
    } finally {
      setIsLoading(false);
    }
  });

  const handleQuickAction = preventDoubleTap((action: typeof QUICK_ACTIONS[0]) => {
    const query = action.query[selectedLanguage];
    handleSend(query);
  });

  const handleClearChat = () => {
    Alert.alert(
      'Clear Chat',
      'Are you sure you want to clear all messages?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: clearMessages },
      ]
    );
  };

  const cycleLanguage = () => {
    const languages: Array<'en' | 'hi' | 'kn'> = ['en', 'hi', 'kn'];
    const currentIndex = languages.indexOf(selectedLanguage);
    const nextIndex = (currentIndex + 1) % languages.length;
    setSelectedLanguage(languages[nextIndex]);
  };

  const getLanguageLabel = () => {
    switch (selectedLanguage) {
      case 'en': return 'EN';
      case 'hi': return 'हिं';
      case 'kn': return 'ಕನ್';
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';

    return (
      <View style={[styles.messageContainer, isUser ? styles.userMessage : styles.assistantMessage]}>
        <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.assistantBubble]}>
          <Text style={[styles.messageText, isUser ? styles.userText : styles.assistantText]}>
            {item.content}
          </Text>
          <Text style={[styles.messageTime, isUser ? styles.userTime : styles.assistantTime]}>
            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MessageCircle size={24} color={colors.primary} />
          <Text style={styles.headerTitle}>AI Shop Assistant</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerButton} onPress={cycleLanguage}>
            <Globe size={20} color={colors.primary} />
            <Text style={styles.languageText}>{getLanguageLabel()}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleClearChat}>
            <Trash2 size={20} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      {messages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MessageCircle size={64} color={colors.gray300} />
          <Text style={styles.emptyTitle}>Welcome to your AI Shop Assistant!</Text>
          <Text style={styles.emptyText}>
            Ask me anything about your shop - sales, stock, recommendations, and more.
          </Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
      )}

      <View style={styles.quickActionsContainer}>
        <FlatList
          horizontal
          data={QUICK_ACTIONS}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.quickActionChip}
              onPress={() => handleQuickAction(item)}
              disabled={isLoading}
            >
              <Text style={styles.quickActionText}>{item.label[selectedLanguage]}</Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickActionsList}
        />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder={
              selectedLanguage === 'hi'
                ? 'अपना सवाल पूछें...'
                : selectedLanguage === 'kn'
                ? 'ನಿಮ್ಮ ಪ್ರಶ್ನೆ ಕೇಳಿ...'
                : 'Ask your question...'
            }
            placeholderTextColor={colors.gray400}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            editable={!isLoading}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
            onPress={() => handleSend()}
            disabled={!inputText.trim() || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Send size={20} color={colors.white} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTitle: {
    ...typography.h3,
  },
  headerRight: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: spacing.sm,
  },
  languageText: {
    ...typography.captionBold,
    color: colors.primary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxxl,
  },
  emptyTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  messagesList: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  messageContainer: {
    maxWidth: '80%',
  },
  userMessage: {
    alignSelf: 'flex-end',
  },
  assistantMessage: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    ...shadows.md,
  },
  userBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: colors.white,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  messageText: {
    ...typography.body,
    marginBottom: spacing.xs,
  },
  userText: {
    color: colors.white,
  },
  assistantText: {
    color: colors.textPrimary,
  },
  messageTime: {
    ...typography.small,
  },
  userTime: {
    color: colors.white,
    opacity: 0.8,
  },
  assistantTime: {
    color: colors.textSecondary,
  },
  quickActionsContainer: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    paddingVertical: spacing.sm,
  },
  quickActionsList: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  quickActionChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    borderColor: colors.primary,
    marginRight: spacing.sm,
    ...shadows.sm,
  },
  quickActionText: {
    ...typography.captionBold,
    color: colors.primary,
    fontSize: 13,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    ...typography.body,
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.gray300,
  },
});
