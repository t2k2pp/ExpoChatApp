/**
 * Feature Selection Modal
 * Modal for toggling frequently-changed features like web search
 * Separates from Settings (which are changed rarely)
 */

import React from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    Switch,
    StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface FeatureSelectionModalProps {
    visible: boolean;
    onClose: () => void;
    webSearchEnabled: boolean;
    onWebSearchToggle: (enabled: boolean) => void;
}

export const FeatureSelectionModal: React.FC<FeatureSelectionModalProps> = ({
    visible,
    onClose,
    webSearchEnabled,
    onWebSearchToggle,
}) => {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableOpacity 
                style={styles.overlay} 
                activeOpacity={1} 
                onPress={onClose}
            >
                <View style={styles.modalContainer}>
                    <TouchableOpacity activeOpacity={1}>
                        <View style={styles.modalContent}>
                            <View style={styles.header}>
                                <Text style={styles.title}>Features</Text>
                                <TouchableOpacity onPress={onClose}>
                                    <Ionicons name="close" size={24} color="#000" />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.featureList}>
                                {/* Web Search */}
                                <View style={styles.featureItem}>
                                    <View style={styles.featureInfo}>
                                        <Ionicons name="globe-outline" size={24} color="#007AFF" />
                                        <View style={styles.featureText}>
                                            <Text style={styles.featureName}>Web Search</Text>
                                            <Text style={styles.featureDescription}>
                                                Search the web for real-time information
                                            </Text>
                                        </View>
                                    </View>
                                    <Switch
                                        value={webSearchEnabled}
                                        onValueChange={onWebSearchToggle}
                                        trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
                                        thumbColor="#FFF"
                                    />
                                </View>

                                {/* File Upload (Coming Soon) */}
                                <View style={[styles.featureItem, styles.disabledFeature]}>
                                    <View style={styles.featureInfo}>
                                        <Ionicons name="document-attach-outline" size={24} color="#999" />
                                        <View style={styles.featureText}>
                                            <Text style={styles.featureName}>File Upload</Text>
                                            <Text style={styles.featureDescription}>
                                                Coming soon
                                            </Text>
                                        </View>
                                    </View>
                                    <Switch
                                        value={false}
                                        disabled
                                        trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
                                        thumbColor="#FFF"
                                    />
                                </View>

                                {/* Voice Input (Coming Soon) */}
                                <View style={[styles.featureItem, styles.disabledFeature]}>
                                    <View style={styles.featureInfo}>
                                        <Ionicons name="mic-outline" size={24} color="#999" />
                                        <View style={styles.featureText}>
                                            <Text style={styles.featureName}>Voice Input</Text>
                                            <Text style={styles.featureDescription}>
                                                Coming soon
                                            </Text>
                                        </View>
                                    </View>
                                    <Switch
                                        value={false}
                                        disabled
                                        trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
                                        thumbColor="#FFF"
                                    />
                                </View>
                            </View>
                        </View>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: '85%',
        maxWidth: 400,
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
        color: '#000',
    },
    featureList: {
        gap: 16,
    },
    featureItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    featureInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
    },
    featureText: {
        flex: 1,
    },
    featureName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#000',
        marginBottom: 4,
    },
    featureDescription: {
        fontSize: 14,
        color: '#666',
    },
    disabledFeature: {
        opacity: 0.5,
    },
});
