/**
 * Thinking Modal Component
 * Displays AI thinking process in a dedicated modal
 */

import React from 'react';
import {
    Modal,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ThinkingModalProps {
    visible: boolean;
    thinkingSteps: string[];
    onClose: () => void;
}

export const ThinkingModal: React.FC<ThinkingModalProps> = ({
    visible,
    thinkingSteps,
    onClose
}) => {
    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>🧠 AIの思考プロセス</Text>
                        <TouchableOpacity
                            onPress={onClose}
                            style={styles.closeButton}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons name="close" size={28} color="#333" />
                        </TouchableOpacity>
                    </View>

                    {/* Content */}
                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollContent}
                    >
                        {thinkingSteps.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>
                                    思考プロセスはありません
                                </Text>
                            </View>
                        ) : (
                            thinkingSteps.map((step, index) => (
                                <View key={index} style={styles.stepContainer}>
                                    <View style={styles.stepHeader}>
                                        <View style={styles.stepNumberBadge}>
                                            <Text style={styles.stepNumber}>
                                                {index + 1}
                                            </Text>
                                        </View>
                                        <Text style={styles.stepLabel}>
                                            思考ステップ
                                        </Text>
                                    </View>
                                    <Text style={styles.stepContent} selectable>
                                        {step}
                                    </Text>
                                </View>
                            ))
                        )}
                    </ScrollView>
                </View>
            </SafeAreaView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F8F8F8',
        paddingTop: 40, // Avoid overlap with status bar
    },
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333',
    },
    closeButton: {
        padding: 4,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
    },
    stepContainer: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    stepHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    stepNumberBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    stepNumber: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFF',
    },
    stepLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#555',
    },
    stepContent: {
        fontSize: 15,
        lineHeight: 22,
        color: '#333',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
    },
});
