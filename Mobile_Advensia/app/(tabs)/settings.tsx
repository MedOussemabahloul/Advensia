import React, { useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Settings,
  User,
  Bell,
  Shield,
  Map,
  Thermometer,
  LogOut,
  ChevronRight,
  Save,
  X,
  Info,
} from 'lucide-react-native';
import { useAuth } from '@/providers/AuthProvider';
import { rtlsService } from '@/services/rtlsService';

interface SettingsItem {
  icon: React.ComponentType<any>;
  title: string;
  subtitle?: string;
  type: 'toggle' | 'navigation' | 'action';
  value?: boolean;
  onPress?: () => void;
  onToggle?: (value: boolean) => void;
}

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [showThresholdModal, setShowThresholdModal] = useState(false);
  const [showGeofenceModal, setShowGeofenceModal] = useState(false);
  const [tempThreshold, setTempThreshold] = useState('25.0');
  const [geofenceRadius, setGeofenceRadius] = useState('500');
  const navigation=useNavigation();
  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: ()=>{logout(); navigation.navigate('auth');},
        },
      ]
    );
  };

  const handleSaveThreshold = async () => {
    try {
      const threshold = parseFloat(tempThreshold);
      if (isNaN(threshold) || threshold < -50 || threshold > 100) {
        Alert.alert('Erreur', 'Veuillez entrer une température valide (-50°C à 100°C)');
        return;
      }
      
      // Simulate API call to update threshold
      await new Promise(resolve => setTimeout(resolve, 500));
      setShowThresholdModal(false);
      Alert.alert('Succès', 'Seuil de température mis à jour');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de mettre à jour le seuil');
    }
  };

  const handleSaveGeofence = async () => {
    try {
      const radius = parseInt(geofenceRadius);
      if (isNaN(radius) || radius < 10 || radius > 5000) {
        Alert.alert('Erreur', 'Veuillez entrer un rayon valide (10m à 5000m)');
        return;
      }
      
      // Simulate API call to update geofence
      await new Promise(resolve => setTimeout(resolve, 500));
      setShowGeofenceModal(false);
      Alert.alert('Succès', 'Zone de sécurité mise à jour');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de mettre à jour la zone');
    }
  };

  const settingsGroups = [
    {
      title: 'Profil',
      items: [
        {
          icon: User,
          title: 'Informations personnelles',
          subtitle: user?.email,
          type: 'navigation' as const,
          onPress: () => {/* Navigate to profile */},
        },
      ],
    },
    {
      title: 'Notifications',
      items: [
        {
          icon: Bell,
          title: 'Notifications push',
          subtitle: 'Recevoir des alertes en temps réel',
          type: 'toggle' as const,
          value: notificationsEnabled,
          onToggle: setNotificationsEnabled,
        },
      ],
    },
    {
      title: 'Périphériques',
      items: [
        {
          icon: Thermometer,
          title: 'Seuil de température',
          subtitle: `Actuellement: ${tempThreshold}°C`,
          type: 'navigation' as const,
          onPress: () => setShowThresholdModal(true),
        },
        {
          icon: Map,
          title: 'Zone de sécurité',
          subtitle: `Rayon: ${geofenceRadius}m`,
          type: 'navigation' as const,
          onPress: () => setShowGeofenceModal(true),
        },
      ],
    },
    {
      title: 'Application',
      items: [
        {
          icon: Shield,
          title: 'Localisation',
          subtitle: 'Autoriser l\'accès à la position',
          type: 'toggle' as const,
          value: locationEnabled,
          onToggle: setLocationEnabled,
        },
        {
          icon: Settings,
          title: 'Actualisation automatique',
          subtitle: 'Mise à jour des données en temps réel',
          type: 'toggle' as const,
          value: autoRefreshEnabled,
          onToggle: setAutoRefreshEnabled,
        },
      ],
    },
    {
      title: 'Compte',
      items: [
        {
          icon: LogOut,
          title: 'Se déconnecter',
          subtitle: 'Fermer la session actuelle',
          type: 'action' as const,
          onPress: handleLogout,
        },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#1E40AF', '#3B82F6']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Paramètres</Text>
        <Text style={styles.headerSubtitle}>
          Configuration de votre application RTLS
        </Text>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {/* User Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileInfo}>
            <View style={styles.avatar}>
              <User size={32} color="#1E40AF" />
            </View>
            <View style={styles.profileText}>
              <Text style={styles.profileName}>{user?.name || 'Utilisateur'}</Text>
              <Text style={styles.profileEmail}>{user?.email}</Text>
              <View style={[
                styles.roleBadge,
                { backgroundColor: user?.role === 'admin' ? '#EF4444' : '#10B981' }
              ]}>
                <Text style={styles.roleText}>
                  {user?.role === 'admin' ? 'Administrateur' : 'Utilisateur'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Settings Groups */}
        {settingsGroups.map((group, groupIndex) => (
          <View key={groupIndex} style={styles.settingsGroup}>
            <Text style={styles.groupTitle}>{group.title}</Text>
            <View style={styles.groupCard}>
              {group.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={itemIndex}
                  style={[
                    styles.settingsItem,
                    itemIndex < group.items.length - 1 && styles.settingsItemBorder
                  ]}
                  onPress={item.onPress}
                  disabled={item.type === 'toggle'}
                >
                  <View style={styles.settingsItemLeft}>
                    <View style={[
                      styles.settingsIcon,
                      { backgroundColor: item.title === 'Se déconnecter' ? '#FEF2F2' : '#EFF6FF' }
                    ]}>
                      <item.icon 
                        size={20} 
                        color={item.title === 'Se déconnecter' ? '#EF4444' : '#1E40AF'} 
                      />
                    </View>
                    <View style={styles.settingsText}>
                      <Text style={[
                        styles.settingsTitle,
                        { color: item.title === 'Se déconnecter' ? '#EF4444' : '#1E293B' }
                      ]}>
                        {item.title}
                      </Text>
                      {item.subtitle && (
                        <Text style={styles.settingsSubtitle}>{item.subtitle}</Text>
                      )}
                    </View>
                  </View>

                  {item.type === 'toggle' ? (
                    <Switch
                      value={item.value}
                      onValueChange={item.onToggle}
                      trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
                      thumbColor={item.value ? '#1E40AF' : '#F3F4F6'}
                    />
                  ) : (
                    <ChevronRight size={20} color="#9CA3AF" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Version 1.0.0</Text>
          <Text style={styles.versionSubtext}>© 2024 Advensia RTLS</Text>
        </View>
      </ScrollView>

      {/* Temperature Threshold Modal */}
      <Modal
        visible={showThresholdModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowThresholdModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seuil de Température</Text>
              <TouchableOpacity
                onPress={() => setShowThresholdModal(false)}
                style={styles.modalCloseButton}
              >
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.infoBox}>
                <Info size={20} color="#1E40AF" />
                <Text style={styles.infoText}>
                  Définissez le seuil de température critique pour vos périphériques.
                  Une alerte sera déclenchée si cette température est dépassée.
                </Text>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Température (°C)</Text>
                <TextInput
                  style={styles.input}
                  value={tempThreshold}
                  onChangeText={setTempThreshold}
                  keyboardType="numeric"
                  placeholder="25.0"
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowThresholdModal(false)}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveThreshold}
              >
                <Save size={16} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>Enregistrer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Geofence Modal */}
      <Modal
        visible={showGeofenceModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowGeofenceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Zone de Sécurité</Text>
              <TouchableOpacity
                onPress={() => setShowGeofenceModal(false)}
                style={styles.modalCloseButton}
              >
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.infoBox}>
                <Info size={20} color="#1E40AF" />
                <Text style={styles.infoText}>
                  Configurez le rayon de la zone de sécurité. Une alerte sera
                  déclenchée si un périphérique sort de cette zone.
                </Text>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Rayon (mètres)</Text>
                <TextInput
                  style={styles.input}
                  value={geofenceRadius}
                  onChangeText={setGeofenceRadius}
                  keyboardType="numeric"
                  placeholder="500"
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowGeofenceModal(false)}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveGeofence}
              >
                <Save size={16} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>Enregistrer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Roboto-Bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Roboto-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  content: {
    flex: 1,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileText: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontFamily: 'Roboto-Bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    fontFamily: 'Roboto-Regular',
    color: '#64748B',
    marginBottom: 8,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 12,
    fontFamily: 'Roboto-Bold',
    color: '#FFFFFF',
  },
  settingsGroup: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  groupTitle: {
    fontSize: 16,
    fontFamily: 'Roboto-Bold',
    color: '#1E293B',
    marginBottom: 8,
    marginLeft: 4,
  },
  groupCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  settingsItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingsIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingsText: {
    flex: 1,
  },
  settingsTitle: {
    fontSize: 16,
    fontFamily: 'Roboto-Medium',
    marginBottom: 2,
  },
  settingsSubtitle: {
    fontSize: 12,
    fontFamily: 'Roboto-Regular',
    color: '#64748B',
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  versionText: {
    fontSize: 14,
    fontFamily: 'Roboto-Medium',
    color: '#64748B',
    marginBottom: 4,
  },
  versionSubtext: {
    fontSize: 12,
    fontFamily: 'Roboto-Regular',
    color: '#9CA3AF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Roboto-Bold',
    color: '#1E293B',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Roboto-Regular',
    color: '#1E40AF',
    marginLeft: 12,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Roboto-Medium',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 16,
    fontSize: 16,
    fontFamily: 'Roboto-Regular',
    backgroundColor: '#F9FAFB',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 12,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  cancelButtonText: {
    fontSize: 14,
    fontFamily: 'Roboto-Medium',
    color: '#64748B',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#1E40AF',
    gap: 6,
  },
  saveButtonText: {
    fontSize: 14,
    fontFamily: 'Roboto-Medium',
    color: '#FFFFFF',
  },
});