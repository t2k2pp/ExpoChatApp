/**
 * App Navigator
 * Configures React Navigation for the application
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ChatListScreen, ChatScreen, SettingsScreen } from '../screens';

export type RootStackParamList = {
    ChatList: undefined;
    Chat: { chatId: number };
    Settings: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
    return (
        <NavigationContainer>
            <Stack.Navigator
                initialRouteName="ChatList"
                screenOptions={{
                    headerStyle: {
                        backgroundColor: '#FFF',
                    },
                    headerTintColor: '#007AFF',
                    headerTitleStyle: {
                        fontWeight: '600',
                    },
                }}
            >
                <Stack.Screen
                    name="ChatList"
                    component={ChatListScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="Chat"
                    component={ChatScreen}
                    options={{
                        title: 'Chat',
                        headerBackTitleVisible: false,
                    }}
                />
                <Stack.Screen
                    name="Settings"
                    component={SettingsScreen}
                    options={{
                        title: 'Settings',
                        presentation: 'modal',
                        headerBackTitleVisible: false,
                    }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
};
