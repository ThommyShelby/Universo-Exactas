import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
  ActivityIndicator,
  Linking,
  StatusBar as RNStatusBar,
  Keyboard,
  TouchableWithoutFeedback,
  RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from './firebaseConfig';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, getDocs } from 'firebase/firestore';

// 🔥 NUEVAS IMPORTACIONES PARA EL VISOR SEGURO 🔥
import { WebView } from 'react-native-webview';
import * as ScreenCapture from 'expo-screen-capture';

const { width, height } = Dimensions.get('window');

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// ==========================================
// 1. CONSTANTES Y CONFIGURACIÓN MANUAL
// ==========================================
const TABLA_DE_PRECIOS = { 'Álgebra Lineal y Análisis 2': 10 };
const PRECIO_POR_DEFECTO = 5000;

// 🔥 OPTATIVAS REALES DE LA UNLP (EXACTAS) 🔥
const OPTATIVAS_FHOM = [
  'Computación',
  'Física del Estado Sólido',
  'Dinámica no Lineal',
  'Electromagnetismo II',
  'Electrónica',
  'Relatividad General',
  'Geometría Diferencial',
  'Análisis Funcional',
  'Física de la Materia Blanda',
  'Probabilidad',
  'Ecuaciones Diferenciales',
  'Mecánica Estadística II',
  'Métodos de la Física Matemática',
  'Sem. Física del Sólido',
  'Sem. de Mecánica Cuántica',
  'Sem. de Óptica Avanzada',
  'Sem. Partículas y Campos',
  'Simulaciones Computacionales',
  'Teoría Cuántica de Campos',
  'Termodinámica',
  'Análisis Matricial',
  'Complementos de Análisis',
  'Elementos de Matemática Aplicada',
  'Estructuras Algebráicas',
  'Funciones Analíticas',
  'Matemática III',
  'Matemáticas en Física',
  'Medida e Integración',
  'Topología',
];

const OPTATIVAS_CIBEX = [
  'Inmunología',
  'Anatomía e Histología',
  'Bioinformática',
  'Fisiopatología',
  'Virología',
  'Toxicología',
  'Bromatología',
  'Química Ambiental',
  'Farmacología',
  'Microbiología Clínica',
];

// 🔥 SISTEMA DE MUESTRAS (SNEAK PEEKS) 🔥
const SNEAK_PEEKS = {};

const getSneakPeekData = (firebaseTitle) => {
  if (!firebaseTitle) return null;
  const cleanFirebaseTitle = firebaseTitle.trim().toLowerCase();
  const key = Object.keys(SNEAK_PEEKS).find(
    (k) => k.trim().toLowerCase() === cleanFirebaseTitle
  );
  return key ? SNEAK_PEEKS[key] : null;
};

const getFileStyle = (filename) => {
  if (!filename) return { icon: 'document-outline', color: '#94A3B8' };
  const nameLower = filename.toLowerCase();
  if (nameLower.match(/\.pdf$/)) return { icon: 'document-text', color: '#EF4444' };
  if (nameLower.match(/\.docx?$/)) return { icon: 'document', color: '#3B82F6' };
  if (nameLower.match(/\.(pptx|wmv)$/)) return { icon: 'easel', color: '#F59E0B' };
  if (nameLower.match(/\.xlsx?$/)) return { icon: 'stats-chart', color: '#10B981' };
  if (nameLower.match(/\.(jpg|jpeg|png|gif|mp4|mp3)$/)) return { icon: 'image', color: '#8B5CF6' };
  if (nameLower.match(/\.(zip|rar)$/)) return { icon: 'archive', color: '#64748B' };
  return { icon: 'document-outline', color: '#94A3B8' };
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 19) return 'Buenas tardes';
  return 'Buenas noches';
};

const SPACE_CAREERS = ['Lic. en Física', 'Lic. en Matemática', 'Lic. en Física Médica'];
const CARRERAS = [
  'Lic. en Física',
  'Lic. en Matemática',
  'Lic. en Física Médica',
  'Lic. en Bioquímica',
  'Farmacia',
  'Lic. en Biotecnología',
  'Lic. en Química',
  'Óptica Ocular y Optometría',
  'Tec. Univ. en Química',
  'Lic. en Cs. de Alimentos',
  'Tec. Univ. en Alimentos',
  'Química y Tec. Ambiental',
];
const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
const MIN_HORA = 8;
const MAX_HORA = 22;
const HORAS = Array.from({ length: MAX_HORA - MIN_HORA + 1 }, (_, i) => i + MIN_HORA);

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidPassword = (p) =>
  p.length >= 6 && /[A-Z]/.test(p) && /[a-z]/.test(p) && /[0-9]/.test(p);

// ==========================================
// 2. COMPONENTES ANIMADOS
// ==========================================
const TwinklingStar = ({ size, top, left, delay }) => {
  const opacity = useRef(new Animated.Value(0.1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: Math.random() * 0.6 + 0.4,
          duration: 1500 + Math.random() * 2000,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.1,
          duration: 1500 + Math.random() * 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: '#FFF',
        top,
        left,
        opacity,
      }}
    />
  );
};

const ShootingStar = () => {
  const translateX = useRef(new Animated.Value(width)).current;
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shoot = () => {
      translateX.setValue(width + 50);
      translateY.setValue(Math.random() * (height / 2) - 100);
      opacity.setValue(1);
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: -200,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: height / 1.5,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 1500,
          delay: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => setTimeout(shoot, Math.random() * 8000 + 5000));
    };
    setTimeout(shoot, 2000);
  }, []);

  return (
    <Animated.View
      style={[
        styles.shootingStar,
        { transform: [{ translateX }, { translateY }, { rotate: '-45deg' }], opacity },
      ]}
    />
  );
};

const AbstractEclipse = () => {
  const translateY = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, {
          toValue: -15,
          duration: 5000,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 5000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: '10%',
        right: -40,
        transform: [{ translateY }],
        opacity: 0.8,
      }}
    >
      <View
        style={{
          width: 140,
          height: 140,
          borderRadius: 70,
          backgroundColor: '#E0E7FF',
          shadowColor: '#818CF8',
          shadowOpacity: 0.8,
          shadowRadius: 30,
        }}
      />
      <View
        style={{
          width: 130,
          height: 130,
          borderRadius: 65,
          backgroundColor: '#050519',
          position: 'absolute',
          top: 5,
          right: 25,
        }}
      />
    </Animated.View>
  );
};

const GalaxyBackground = () => {
  const stars = useMemo(
    () =>
      Array.from({ length: 40 }).map((_, i) => ({
        id: i,
        size: Math.random() * 3 + 1,
        top: Math.random() * height,
        left: Math.random() * width,
        delay: Math.random() * 3000,
      })),
    []
  );

  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 5000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 5000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={StyleSheet.absoluteFillObject}>
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#050519' }]} />
      <Animated.View
        style={[
          styles.nebula,
          {
            top: -50,
            right: -50,
            backgroundColor: '#4F46E5',
            transform: [{ scale: pulseAnim }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.nebula,
          {
            bottom: height / 4,
            left: -100,
            backgroundColor: '#8B5CF6',
            width: 350,
            height: 350,
            transform: [{ scale: pulseAnim }],
          },
        ]}
      />
      {stars.map((star) => (
        <TwinklingStar
          key={star.id}
          size={star.size}
          top={star.top}
          left={star.left}
          delay={star.delay}
        />
      ))}
      <AbstractEclipse />
      <ShootingStar />
    </View>
  );
};

const FloatingBubble = ({ size, left, delay, duration }) => {
  const translateY = useRef(new Animated.Value(height)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const float = () => {
      translateY.setValue(height);
      opacity.setValue(Math.random() * 0.4 + 0.1);
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -100,
          duration: duration,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: duration,
          useNativeDriver: true,
        }),
      ]).start(() => float());
    };
    setTimeout(float, delay);
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 1,
        borderColor: '#34D399',
        backgroundColor: 'rgba(52, 211, 153, 0.1)',
        left,
        transform: [{ translateY }],
        opacity,
      }}
    />
  );
};

const ChemistryBackground = () => {
  const bubbles = useMemo(
    () =>
      Array.from({ length: 30 }).map((_, i) => ({
        id: i,
        size: Math.random() * 20 + 10,
        left: Math.random() * width,
        delay: Math.random() * 5000,
        duration: Math.random() * 6000 + 4000,
      })),
    []
  );

  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={StyleSheet.absoluteFillObject}>
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#022C22' }]} />
      <Animated.View
        style={[
          styles.nebula,
          {
            top: -50,
            right: -50,
            backgroundColor: '#059669',
            transform: [{ scale: pulseAnim }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.nebula,
          {
            bottom: height / 4,
            left: -100,
            backgroundColor: '#0D9488',
            width: 350,
            height: 350,
            transform: [{ scale: pulseAnim }],
          },
        ]}
      />
      {bubbles.map((b) => (
        <FloatingBubble
          key={b.id}
          size={b.size}
          left={b.left}
          delay={b.delay}
          duration={b.duration}
        />
      ))}
      <View
        style={{
          position: 'absolute',
          top: '15%',
          right: 20,
          opacity: 0.15,
          transform: [{ rotate: '15deg' }],
        }}
      >
        <Ionicons name="flask" size={150} color="#34D399" />
      </View>
      <View
        style={{
          position: 'absolute',
          bottom: '10%',
          left: -20,
          opacity: 0.1,
          transform: [{ rotate: '-20deg' }],
        }}
      >
        <Ionicons name="beaker" size={180} color="#2DD4BF" />
      </View>
    </View>
  );
};

// ==========================================
// 3. COMPONENTE PRINCIPAL (APP)
// ==========================================
export default function App() {
  const [isAppReady, setIsAppReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [userCareer, setUserCareer] = useState('');

  const [logoTaps, setLogoTaps] = useState(0);
  const [showEasterEgg, setShowEasterEgg] = useState(false);
  const [titleTaps, setTitleTaps] = useState(0);

  const [pomodoroVisible, setPomodoroVisible] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [timerActive, setTimerActive] = useState(false);

  // ESTADOS DE PLAN DE ESTUDIO
  const [activeTab, setActiveTab] = useState('Plan');
  const [plan, setPlan] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [notas, setNotas] = useState({});
  const [optativasNames, setOptativasNames] = useState({});
  const [avisos, setAvisos] = useState([
    {
      id: '1',
      title: '¡Bienvenidos a Universo Exactas!',
      desc: 'Gracias por ser parte. Explora la tienda, arma tus horarios y domina tu carrera.',
      date: 'Novedad',
    },
  ]);

  // MODALES EXTRAS
  const [noticesModalVisible, setNoticesModalVisible] = useState(false);
  const [gradeModalVisible, setGradeModalVisible] = useState(false);
  const [pendingSubject, setPendingSubject] = useState(null);
  const [tempGrade, setTempGrade] = useState('');

  // MODAL OPTATIVAS
  const [optativaModalVisible, setOptativaModalVisible] = useState(false);
  const [selectedOptativaNode, setSelectedOptativaNode] = useState(null);
  const [customOptativaText, setCustomOptativaText] = useState('');

  // MODAL PAGOS
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedPackForPayment, setSelectedPackForPayment] = useState(null);
  
  // MODAL DISCLAIMER LEGAL
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);

  // 🔥 ESTADOS PARA EL VISOR SEGURO 🔥
  const [pdfViewerVisible, setPdfViewerVisible] = useState(false);
  const [currentPdfNode, setCurrentPdfNode] = useState(null);

  // HORARIOS
  const [scheduleModalVisible, setScheduleModalVisible] = useState(false);
  const [horariosSubTab, setHorariosSubTab] = useState('grilla');
  const [scheduleEntryMode, setScheduleEntryMode] = useState('materia');
  const [customEventTitle, setCustomEventTitle] = useState('');
  const [customEventDate, setCustomEventDate] = useState('');
  const [newSubject, setNewSubject] = useState(null);
  const [newDay, setNewDay] = useState('Lunes');
  const [newStartTime, setNewStartTime] = useState('8');
  const [newEndTime, setNewEndTime] = useState('10');

  const [careerModalVisible, setCareerModalVisible] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [customAlert, setCustomAlert] = useState({
    visible: false,
    title: '',
    message: '',
    buttons: null,
  });
  const [refreshing, setRefreshing] = useState(false);

  // MERCADO
  const [mercadoSubTab, setMercadoSubTab] = useState('tienda');
  const [storeFilter, setStoreFilter] = useState('ALL');
  const [misApuntes, setMisApuntes] = useState([]);
  const [drivePath, setDrivePath] = useState([]);
  const [tiendaData, setTiendaData] = useState([]);
  const [isStoreLoading, setIsStoreLoading] = useState(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // ----------------------------------------------------
  // POMODORO TIMER EFECTO
  // ----------------------------------------------------
  useEffect(() => {
    let interval = null;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0 && timerActive) {
      setTimerActive(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Notifications.scheduleNotificationAsync({
        content: {
          title: '¡Tiempo completado! 🧠',
          body: 'Buen trabajo. Tómate 5 minutos de descanso.',
          sound: true,
        },
        trigger: null,
      });
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // ----------------------------------------------------
  // EASTER EGGS
  // ----------------------------------------------------
  const handleTitleTap = async () => {
    setTitleTaps((prev) => {
      const next = prev + 1;
      if (next >= 20) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        activarModoDios();
        return 0;
      }
      return next;
    });
  };

  const activarModoDios = async () => {
    if (auth.currentUser && tiendaData.length > 0) {
      const allPackIds = tiendaData.map((pack) => pack.id);
      try {
        await setDoc(
          doc(db, 'usuarios', auth.currentUser.uid),
          { misApuntes: allPackIds },
          { merge: true }
        );
        setMisApuntes(allPackIds);
        showAlert(
          '👑 Modo Dios Activado',
          'Has desbloqueado absolutamente todo el contenido de la tienda. ¡Disfruta tu poder!'
        );
      } catch (e) {}
    }
  };

  // ----------------------------------------------------
  // INICIALIZACIÓN
  // ----------------------------------------------------
  useEffect(() => {
    const initApp = async () => {
      RNStatusBar.setHidden(true, 'fade');
      if (Platform.OS === 'android') {
        try {
          await NavigationBar.setVisibilityAsync('hidden');
          await NavigationBar.setBehaviorAsync('overlay-swipe');
        } catch (error) {}
      }
      try {
        await Notifications.requestPermissionsAsync();
      } catch (error) {}

      const hoy = new Date();
      const str =
        hoy.getFullYear() +
        '-' +
        String(hoy.getMonth() + 1).padStart(2, '0') +
        '-' +
        String(hoy.getDate()).padStart(2, '0');
      setCustomEventDate(str);

      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          await loadOfflineOrOnlineData(user.uid);
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          setIsAppReady(true);
        }
      });
      return unsubscribe;
    };
    initApp();
  }, []);

  const loadOfflineOrOnlineData = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, 'usuarios', uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserCareer(data.career || '');
        setNotas(data.notas || {});
        setOptativasNames(data.optativasNames || {});
        setMisApuntes(data.misApuntes || []);
        cleanOldEvents(data.horarios || []);

        if (data.tutorialCompleted === true) {
          setHasSeenOnboarding(true);
        } else {
          setHasSeenOnboarding(false);
          setCurrentSlideIndex(0);
        }
        
        // Verifica si el usuario ya aceptó el disclaimer
        setDisclaimerAccepted(data.disclaimerAccepted || false);

        await AsyncStorage.setItem(`@offline_profile_${uid}`, JSON.stringify(data));
        if (data.career) {
          const planDoc = await getDoc(doc(db, 'planes_estudio', data.career));
          if (planDoc.exists()) {
            const materiasDelBack =
              planDoc.data().materias || planDoc.data().planes_estudio || [];
            const basePlan = materiasDelBack.map((subj) => ({
              ...subj,
              completed: (data.completedSubjects || []).includes(subj.id),
              cursada: (data.cursadas || []).includes(subj.id),
              customName: (data.optativasNames || {})[subj.id] || null,
            }));
            setPlan(basePlan);
            await AsyncStorage.setItem(
              `@offline_plan_${uid}`,
              JSON.stringify(basePlan)
            );
          }
        }
      } else {
        setHasSeenOnboarding(false);
      }

      const querySnapshot = await getDocs(collection(db, 'tienda_apuntes'));
      let packsDisponibles = [];
      querySnapshot.docs.forEach((docSnap) => {
        const rootData = docSnap.data();
        const category = rootData.category || 'General';
        const carpetasRaiz = rootData.driveTree?.children || [];

        carpetasRaiz.forEach((carpetaPack, index) => {
          if (carpetaPack.type === 'folder') {
            const subMaterias = carpetaPack.children
              .filter((c) => c.type === 'folder')
              .map((c) => c.name)
              .join(' + ');
            packsDisponibles.push({
              id: `${docSnap.id}_pack_${index}`,
              title: carpetaPack.name,
              category: category,
              price: calcularPrecio(carpetaPack.name),
              icon: category === 'FHOM' ? 'calculator' : 'flask',
              subjects: subMaterias.length > 0 ? subMaterias : 'Material de estudio y resúmenes',
              driveTree: carpetaPack,
            });
          }
        });
      });

      packsDisponibles.sort((a, b) => {
        const pesoA = calcularPesoDeOrden(a.title);
        const pesoB = calcularPesoDeOrden(b.title);
        if (pesoA !== pesoB) return pesoA - pesoB;
        return a.title.localeCompare(b.title);
      });
      setTiendaData(packsDisponibles);
      await AsyncStorage.setItem('@offline_tienda', JSON.stringify(packsDisponibles));

      try {
        const avisosSnap = await getDocs(collection(db, 'avisos_comunitarios'));
        if (!avisosSnap.empty) {
          setAvisos(avisosSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        }
      } catch (e) {}
    } catch (error) {
      const localProfile = await AsyncStorage.getItem(`@offline_profile_${uid}`);
      const localPlan = await AsyncStorage.getItem(`@offline_plan_${uid}`);
      const localTienda = await AsyncStorage.getItem('@offline_tienda');
      
      if (localProfile) {
        const d = JSON.parse(localProfile);
        setUserCareer(d.career || '');
        setNotas(d.notas || {});
        setOptativasNames(d.optativasNames || {});
        setMisApuntes(d.misApuntes || []);
        cleanOldEvents(d.horarios || []);
        setHasSeenOnboarding(d.tutorialCompleted || false);
        setDisclaimerAccepted(d.disclaimerAccepted || false);
      }
      if (localPlan) setPlan(JSON.parse(localPlan));
      if (localTienda) setTiendaData(JSON.parse(localTienda));
      showAlert('Modo Sin Conexión', 'Estás viendo una copia de seguridad local.');
    } finally {
      setIsStoreLoading(false);
      setIsAppReady(true);
    }
  };

  const isSpaceTheme = !userCareer || SPACE_CAREERS.includes(userCareer);
  const theme = {
    primary: isSpaceTheme ? '#818CF8' : '#34D399',
    secondary: isSpaceTheme ? '#6366F1' : '#059669',
    bgLight: isSpaceTheme ? 'rgba(129, 140, 248, 0.2)' : 'rgba(52, 211, 153, 0.2)',
    iconHeader: isSpaceTheme ? 'planet' : 'flask',
    Background: isSpaceTheme ? GalaxyBackground : ChemistryBackground,
  };
  const DynamicBackground = theme.Background;

  const listaSugeridaDeOptativas = isSpaceTheme ? OPTATIVAS_FHOM : OPTATIVAS_CIBEX;

  const showAlert = (title, message, buttons = null) =>
    setCustomAlert({ visible: true, title, message, buttons });

  const handleLogoTap = () => {
    setLogoTaps((prev) => {
      const next = prev + 1;
      if (next >= 7) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setShowEasterEgg(true);
        return 0;
      }
      return next;
    });
  };

  const completeOnboarding = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setHasSeenOnboarding(true);
    if (auth.currentUser) {
      try {
        await setDoc(
          doc(db, 'usuarios', auth.currentUser.uid),
          { tutorialCompleted: true },
          { merge: true }
        );
      } catch (e) {}
    }
  };

  const cleanOldEvents = async (allHorarios) => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const horariosFiltrados = allHorarios.filter((h) => {
      if (!h.isCustom || !h.date) return true;
      const partes = h.date.split('-');
      if (partes.length !== 3) return true;
      const fechaEvento = new Date(
        parseInt(partes[0]),
        parseInt(partes[1]) - 1,
        parseInt(partes[2])
      );
      fechaEvento.setHours(0, 0, 0, 0);
      return fechaEvento >= hoy;
    });
    setHorarios(horariosFiltrados);
  };

  const calcularPesoDeOrden = (t) => {
    const tit = t.toLowerCase();
    if (tit.includes('ingreso')) return 10;
    if (tit.includes('álgebra') || tit.includes('algebra')) return 20;
    if (tit.includes('análisis 1')) return 30;
    if (tit.includes('química general')) return 40;
    return 100;
  };

  const calcularPrecio = (t) =>
    TABLA_DE_PRECIOS[t] !== undefined ? TABLA_DE_PRECIOS[t] : PRECIO_POR_DEFECTO;

  // ----------------------------------------------------
  // MANEJO DE SESIONES
  // ----------------------------------------------------
  const handleLogin = async () => {
    Keyboard.dismiss();
    if (email.trim() === '' || password === '')
      return showAlert('Faltan datos', 'Por favor, ingresa tu correo y contraseña.');
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert('Acceso denegado', 'El correo o la contraseña son incorrectos.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    Keyboard.dismiss();
    const trimmedEmail = email.trim();
    if (trimmedEmail === '' || password === '' || userCareer === '')
      return showAlert('Faltan Datos', 'Completa todos los campos y selecciona tu carrera.');
    if (!isValidEmail(trimmedEmail))
      return showAlert('Correo inválido', 'Formato de correo no válido.');
    if (!isValidPassword(password))
      return showAlert(
        'Contraseña débil',
        'Mínimo 6 caracteres, 1 mayúscula, 1 minúscula y 1 número.'
      );
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
      await setDoc(doc(db, 'usuarios', userCredential.user.uid), {
        email: trimmedEmail,
        career: userCareer,
        fechaRegistro: new Date(),
        completedSubjects: [],
        cursadas: [],
        horarios: [],
        misApuntes: [],
        notas: {},
        optativasNames: {},
        tutorialCompleted: false,
        disclaimerAccepted: false, // Inicializamos en falso
      });
      await loadOfflineOrOnlineData(userCredential.user.uid);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert('Error', 'El correo ya está en uso.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsAuthenticated(false);
      setPlan([]);
      setHorarios([]);
      setMisApuntes([]);
      setDrivePath([]);
      setNotas({});
      setPassword('');
      setTiendaData([]);
      setUserCareer('');
      setHasSeenOnboarding(false);
      setCurrentSlideIndex(0);
      setDisclaimerAccepted(false);
      setShowDisclaimer(false);
    } catch (error) {}
  };

  // ----------------------------------------------------
  // LOGICA DE MATERIAS
  // ----------------------------------------------------
  const isSubjectUnlocked = (subject) =>
    !subject.dependencies ||
    subject.dependencies.length === 0 ||
    subject.dependencies.every(
      (depId) =>
        plan.find((s) => s.id === depId)?.completed ||
        plan.find((s) => s.id === depId)?.cursada
    );

  const availableSubjects = useMemo(
    () => (plan ? plan.filter((s) => !s.completed && isSubjectUnlocked(s)) : []),
    [plan]
  );

  const handleSubjectPress = (subject) => {
    if (isSubjectUnlocked(subject)) {
      Haptics.selectionAsync();

      if (
        subject.title.toLowerCase().includes('optativa') &&
        !subject.customName &&
        !subject.completed &&
        !subject.cursada
      ) {
        setSelectedOptativaNode(subject);
        setCustomOptativaText('');
        setOptativaModalVisible(true);
        return;
      }

      if (subject.completed) {
        showAlert(
          'Materia Aprobada',
          `¿Qué deseas hacer con "${subject.customName || subject.title}"?`,
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: "Revertir a 'Solo Cursada'",
              onPress: () => undoStatus(subject, 'to_cursada'),
            },
            {
              text: 'Quitar aprobación',
              style: 'destructive',
              onPress: () => undoStatus(subject, 'to_pending'),
            },
          ]
        );
      } else {
        setPendingSubject(subject);
        setTempGrade('');
        setGradeModalVisible(true);
      }
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      const missingDeps = subject.dependencies
        .filter(
          (depId) =>
            !(
              plan.find((s) => s.id === depId)?.completed ||
              plan.find((s) => s.id === depId)?.cursada
            )
        )
        .map((depId) => plan.find((s) => s.id === depId)?.title || depId)
        .join(', ');
      showAlert(
        'Materia Bloqueada 🔒',
        `Para cursar "${subject.title}" debes tener al menos la cursada de:\n\n• ${missingDeps}`
      );
    }
  };

  const handleLongPressSubject = (subject) => {
    if (subject.title.toLowerCase().includes('optativa')) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setSelectedOptativaNode(subject);
      setCustomOptativaText(subject.customName || '');
      setOptativaModalVisible(true);
    }
  };

  const saveOptativaName = (name) => {
    if (!name.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const newOptNames = { ...optativasNames, [selectedOptativaNode.id]: name.trim() };
    setOptativasNames(newOptNames);
    const newPlan = plan.map((s) =>
      s.id === selectedOptativaNode.id ? { ...s, customName: name.trim() } : s
    );
    setPlan(newPlan);
    setOptativaModalVisible(false);
    if (auth.currentUser) {
      setDoc(
        doc(db, 'usuarios', auth.currentUser.uid),
        { optativasNames: newOptNames },
        { merge: true }
      ).catch(() => {});
    }
  };

  const submitGrade = (type) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    let newPlan = [...plan];
    let nuevasNotas = { ...notas };

    if (type === 'final') {
      newPlan = newPlan.map((subj) =>
        subj.id === pendingSubject.id ? { ...subj, completed: true, cursada: true } : subj
      );
      nuevasNotas[pendingSubject.id] = parseInt(tempGrade);
    } else if (type === 'cursada') {
      newPlan = newPlan.map((subj) =>
        subj.id === pendingSubject.id
          ? { ...subj, completed: false, cursada: true }
          : subj
      );
    }

    setPlan(newPlan);
    setNotas(nuevasNotas);
    setGradeModalVisible(false);
    setPendingSubject(null);
    
    if (auth.currentUser) {
      const completedIds = newPlan.filter((s) => s.completed).map((s) => s.id);
      const cursadasIds = newPlan.filter((s) => s.cursada && !s.completed).map((s) => s.id);
      setDoc(
        doc(db, 'usuarios', auth.currentUser.uid),
        { completedSubjects: completedIds, cursadas: cursadasIds, notas: nuevasNotas },
        { merge: true }
      ).catch(() => {});
    }
  };

  const undoStatus = (subject, action) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    let newPlan = [...plan];
    let nuevasNotas = { ...notas };

    if (action === 'to_cursada') {
      newPlan = newPlan.map((s) =>
        s.id === subject.id ? { ...s, completed: false, cursada: true } : s
      );
      delete nuevasNotas[subject.id];
    } else if (action === 'to_pending') {
      newPlan = newPlan.map((s) =>
        s.id === subject.id ? { ...s, completed: false, cursada: false } : s
      );
      delete nuevasNotas[subject.id];
    }

    setPlan(newPlan);
    setNotas(nuevasNotas);
    
    if (auth.currentUser) {
      const completedIds = newPlan.filter((s) => s.completed).map((s) => s.id);
      const cursadasIds = newPlan.filter((s) => s.cursada && !s.completed).map((s) => s.id);
      setDoc(
        doc(db, 'usuarios', auth.currentUser.uid),
        { completedSubjects: completedIds, cursadas: cursadasIds, notas: nuevasNotas },
        { merge: true }
      ).catch(() => {});
    }
  };

  const calculateAverage = () => {
    const vals = Object.values(notas);
    if (vals.length === 0) return '-';
    const sum = vals.reduce((a, b) => a + b, 0);
    return (sum / vals.length).toFixed(2);
  };

  const progressPercentage = useMemo(
    () =>
      plan.length === 0
        ? 0
        : Math.round((plan.filter((s) => s.completed).length / plan.length) * 100),
    [plan]
  );
  
  const planByYear = useMemo(() => {
    const grouped = {};
    plan.forEach((subj) => {
      if (!grouped[subj.year]) grouped[subj.year] = [];
      grouped[subj.year].push(subj);
    });
    return grouped;
  }, [plan]);

  const switchTab = (tab) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Mostramos el disclaimer si entra a Apuntes y no lo ha aceptado
    if (tab === 'Mercado' && !disclaimerAccepted) {
      setShowDisclaimer(true);
    }

    setActiveTab(tab);
    setDrivePath([]);
  };

  // ----------------------------------------------------
  // LOGICA DE HORARIOS
  // ----------------------------------------------------
  const addToSchedule = async () => {
    const start = parseInt(newStartTime);
    const end = parseInt(newEndTime);
    
    if (isNaN(start) || isNaN(end) || start < MIN_HORA || end > MAX_HORA + 1 || start >= end)
      return showAlert('Horario Inválido', 'Ingresa un rango lógico.');
      
    let blockTitle = '',
      blockCode = '',
      blockColor = theme.primary,
      blockDay = newDay,
      blockDate = null;
    let programmedNotifIds = [];

    if (scheduleEntryMode === 'materia') {
      if (!newSubject) return showAlert('Falta Materia', 'Selecciona una materia.');
      blockTitle = newSubject.customName || newSubject.title;
      blockCode = newSubject.id;
      
      if (
        horarios
          .filter((h) => h.day === blockDay && !h.isCustom)
          .some((evento) => start < evento.end && end > evento.start)
      ) {
        return showAlert('Cruce', 'Bloque ocupado.');
      }
    } else {
      if (customEventTitle.trim() === '')
        return showAlert('Falta Título', 'Escribe un nombre.');
      const cleanDate = customEventDate.trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanDate))
        return showAlert('Fecha', 'Usa YYYY-MM-DD.');
        
      const partes = cleanDate.split('-');
      const dateObj = new Date(
        parseInt(partes[0]),
        parseInt(partes[1]) - 1,
        parseInt(partes[2])
      );
      
      const diasArray = [
        'Domingo',
        'Lunes',
        'Martes',
        'Miércoles',
        'Jueves',
        'Viernes',
        'Sábado',
      ];
      
      blockDay = diasArray[dateObj.getDay()];
      blockTitle = customEventTitle;
      blockCode = 'EXAMEN';
      blockColor = '#EF4444';
      blockDate = cleanDate;

      try {
        const eventTriggerDate = new Date(dateObj);
        eventTriggerDate.setHours(start, 0, 0, 0);
        const threeDaysBefore = new Date(
          eventTriggerDate.getTime() - 3 * 24 * 60 * 60 * 1000
        );
        const oneDayBefore = new Date(
          eventTriggerDate.getTime() - 24 * 60 * 60 * 1000
        );

        if (threeDaysBefore > new Date()) {
          const id3 = await Notifications.scheduleNotificationAsync({
            content: {
              title: `¡Faltan 3 días! 🚨`,
              body: `Ve preparando: ${customEventTitle}.`,
              sound: true,
            },
            trigger: { date: threeDaysBefore },
          });
          programmedNotifIds.push(id3);
        }
        
        if (oneDayBefore > new Date()) {
          const id1 = await Notifications.scheduleNotificationAsync({
            content: {
              title: `¡Mañana es el gran día! 🚨`,
              body: `Mucho éxito en: ${customEventTitle} a las ${start}:00 hs.`,
              sound: true,
            },
            trigger: { date: oneDayBefore },
          });
          programmedNotifIds.push(id1);
        }
      } catch (e) {}
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const newHorario = {
      id: Math.random().toString(),
      subject: blockTitle,
      code: blockCode,
      day: blockDay,
      start: start,
      end: end,
      color: blockColor,
      isCustom: scheduleEntryMode === 'evento',
      date: blockDate,
      notificationIds: programmedNotifIds,
    };
    
    const updatedHorarios = [...horarios, newHorario];
    setHorarios(updatedHorarios);
    setScheduleModalVisible(false);
    setNewSubject(null);
    setCustomEventTitle('');
    setNewStartTime('8');
    setNewEndTime('10');
    
    if (scheduleEntryMode === 'materia') {
      setSelectedDayTab(newDay);
      setHorariosSubTab('grilla');
    } else {
      setHorariosSubTab('eventos');
    }
    
    if (auth.currentUser) {
      setDoc(
        doc(db, 'usuarios', auth.currentUser.uid),
        { horarios: updatedHorarios },
        { merge: true }
      ).catch((e) => {});
    }
  };

  const removeScheduleItem = async (id) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setCustomAlert({ visible: false, title: '', message: '', buttons: null });
    
    const eventoToDelete = horarios.find((item) => item.id === id);
    const updatedHorarios = horarios.filter((item) => item.id !== id);
    setHorarios(updatedHorarios);

    if (eventoToDelete && eventoToDelete.notificationIds) {
      for (let nId of eventoToDelete.notificationIds) {
        await Notifications.cancelScheduledNotificationAsync(nId).catch(() => {});
      }
    }
    if (auth.currentUser) {
      setDoc(
        doc(db, 'usuarios', auth.currentUser.uid),
        { horarios: updatedHorarios },
        { merge: true }
      ).catch((e) => {});
    }
  };

  // ----------------------------------------------------
  // LOGICA DE PAGOS Y MERCADO
  // ----------------------------------------------------
  const handleBuyButtonPress = (pack) => {
    Haptics.selectionAsync();
    setSelectedPackForPayment(pack);
    setPaymentModalVisible(true);
  };

  const procesarCompra = async (pack) => {
    setPaymentModalVisible(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsProcessingPayment(true);
    try {
      const SERVER_URL = 'https://universo-exactas-pagos.onrender.com/crear_preferencia';
      const response = await fetch(SERVER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: pack.title,
          price: pack.price,
          packId: pack.id,
          userId: auth.currentUser?.uid || 'anon',
        }),
      });
      const data = await response.json();
      if (data.init_point) {
        await WebBrowser.openBrowserAsync(data.init_point);
        setIsProcessingPayment(false);
        showAlert(
          'Transacción en progreso ⏳',
          "Si pagaste con éxito, ve a la pestaña 'Mis Apuntes' y desliza hacia abajo para actualizar."
        );
        setMercadoSubTab('mis_apuntes');
      } else {
        showAlert('Error', 'No se pudo generar el link de pago.');
        setIsProcessingPayment(false);
      }
    } catch (error) {
      showAlert('Error de Conexión', 'El servidor de pagos no está disponible o no hay internet.');
      setIsProcessingPayment(false);
    }
  };

  const handleSneakPeek = (packTitle) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const peekData = getSneakPeekData(packTitle);
    if (peekData && peekData.url) {
      showAlert(
        'Vista Previa 👁️',
        `Estás observando una vista previa del contenido de esta carpeta.\n\nLa misma contiene un total de aproximadamente ${peekData.fileCount} archivos similares a este.`,
        [
          { text: 'Volver', style: 'cancel' },
          {
            text: 'Ver Muestra',
            onPress: () => WebBrowser.openBrowserAsync(peekData.url),
          },
        ]
      );
    }
  };

  // 🔥 LÓGICA DE APERTURA DE ARCHIVOS (VISOR SEGURO UNIVERSAL) 🔥
  const renderDriveNode = async (node) => {
    if (node.type === 'file') {
      if (node.url) {
        // Ahora abrimos TODOS los archivos con el visor seguro
        setCurrentPdfNode(node);
        setPdfViewerVisible(true);
        try {
          await ScreenCapture.preventScreenCaptureAsync();
        } catch (e) {
          console.log("No se pudo bloquear la captura", e);
        }
      } else {
        showAlert('Aviso', 'Este archivo aún no tiene un enlace vinculado.');
      }
      return;
    }
    setDrivePath([...drivePath, node]);
  };

  const closePdfViewer = async () => {
    setPdfViewerVisible(false);
    setCurrentPdfNode(null);
    try {
      await ScreenCapture.allowScreenCaptureAsync();
    } catch (e) {
      console.log("No se pudo desbloquear la captura", e);
    }
  };
  
  const handleBackDrive = () => {
    setDrivePath(drivePath.slice(0, -1));
  };

  const renderAlertContent = () => (
    <View style={styles.customAlertCard}>
      <View style={[styles.alertIconBubble, { backgroundColor: theme.primary + '20' }]}>
        <Ionicons name="alert-circle" size={36} color={theme.primary} />
      </View>
      <Text style={styles.alertTitle}>{customAlert.title}</Text>
      <Text style={styles.alertMessage}>{customAlert.message}</Text>
      <View style={styles.alertButtonsRow}>
        {customAlert.buttons ? (
          customAlert.buttons.map((btn, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.alertBtn,
                {
                  backgroundColor:
                    btn.style === 'destructive'
                      ? '#EF4444'
                      : btn.style === 'cancel'
                      ? '#334155'
                      : theme.secondary,
                },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setCustomAlert({ visible: false, title: '', message: '', buttons: null });
                if (btn.onPress) setTimeout(btn.onPress, 300);
              }}
            >
              <Text style={styles.alertBtnText}>{btn.text}</Text>
            </TouchableOpacity>
          ))
        ) : (
          <TouchableOpacity
            style={[styles.alertBtn, { backgroundColor: theme.secondary }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setCustomAlert({ visible: false, title: '', message: '', buttons: null });
            }}
          >
            <Text style={styles.alertBtnText}>Entendido</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  // ==========================================
  // PANTALLAS DE CARGA Y AUTENTICACIÓN
  // ==========================================
  if (!isAppReady)
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#050519',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator size="large" color="#818CF8" />
        <Text style={{ color: '#818CF8', marginTop: 15, fontWeight: 'bold' }}>
          Iniciando Universo...
        </Text>
      </View>
    );

  if (!isAuthenticated) {
    return (
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{ flex: 1 }}>
          <StatusBar style="light" />
          <DynamicBackground />
          <SafeAreaView style={{ flex: 1 }}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={{ flex: 1 }}
            >
              <ScrollView
                contentContainerStyle={styles.authScrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={handleLogoTap}
                  style={[styles.logoContainer, { marginTop: height * 0.05 }]}
                >
                  <Ionicons
                    name={theme.iconHeader}
                    size={width * 0.18}
                    color={theme.primary}
                    style={{ marginBottom: 10 }}
                  />
                  <Text style={[styles.authTitleLine1, { textShadowColor: theme.bgLight }]}>
                    UNIVERSO
                  </Text>
                  <Text style={[styles.authTitleLine2, { textShadowColor: theme.bgLight }]}>
                    EXACTAS
                  </Text>
                  <Text style={[styles.authSubtitle, { color: theme.primary }]}>
                    La facultad en tu bolsillo.
                  </Text>
                </TouchableOpacity>
                <View
                  style={[
                    styles.glassCard,
                    { borderColor: theme.bgLight, marginBottom: height * 0.05 },
                  ]}
                >
                  <Text style={styles.authModeTitle}>
                    {authMode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta Nueva'}
                  </Text>
                  <View style={styles.unifiedInputContainer}>
                    <Ionicons
                      name="mail"
                      size={20}
                      color={theme.primary}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.unifiedInput}
                      placeholder="alumno@exactas.unlp.edu.ar"
                      placeholderTextColor="#64748B"
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                    />
                  </View>
                  <View style={styles.unifiedInputContainer}>
                    <Ionicons
                      name="lock-closed"
                      size={20}
                      color={theme.primary}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.unifiedInput}
                      placeholder="Contraseña"
                      placeholderTextColor="#64748B"
                      secureTextEntry={!showPassword}
                      value={password}
                      onChangeText={setPassword}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={{ paddingHorizontal: 5 }}
                    >
                      <Ionicons
                        name={showPassword ? 'eye-off' : 'eye'}
                        size={22}
                        color="#64748B"
                      />
                    </TouchableOpacity>
                  </View>
                  {authMode === 'register' && (
                    <TouchableOpacity
                      style={styles.unifiedInputContainer}
                      onPress={() => {
                        Keyboard.dismiss();
                        setCareerModalVisible(true);
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <Ionicons
                          name="school"
                          size={20}
                          color={theme.primary}
                          style={styles.inputIcon}
                        />
                        <Text
                          style={[styles.selectorTextDark, !userCareer && { color: '#64748B' }]}
                          numberOfLines={1}
                        >
                          {userCareer ? userCareer : 'Selecciona tu carrera...'}
                        </Text>
                      </View>
                      <Ionicons name="chevron-down" size={20} color="#64748B" />
                    </TouchableOpacity>
                  )}
                  {authMode === 'login' ? (
                    <>
                      <TouchableOpacity
                        style={[
                          styles.loginButton,
                          { backgroundColor: theme.secondary, shadowColor: theme.primary },
                        ]}
                        onPress={handleLogin}
                        activeOpacity={0.8}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <ActivityIndicator color="#FFF" size="small" />
                        ) : (
                          <>
                            <Text style={styles.loginButtonText}>Entrar</Text>
                            <Ionicons name="log-in-outline" size={20} color="#FFF" />
                          </>
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.switchModeBtn}
                        onPress={() => {
                          setAuthMode('register');
                          setUserCareer('');
                          setPassword('');
                        }}
                      >
                        <Text style={styles.switchModeText}>
                          ¿No tienes cuenta?{' '}
                          <Text style={[styles.switchModeTextBold, { color: theme.primary }]}>
                            Regístrate aquí
                          </Text>
                        </Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <>
                      <TouchableOpacity
                        style={[
                          styles.loginButton,
                          { backgroundColor: theme.primary, shadowColor: theme.primary },
                        ]}
                        onPress={handleRegister}
                        activeOpacity={0.8}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <ActivityIndicator color="#FFF" size="small" />
                        ) : (
                          <>
                            <Text style={styles.loginButtonText}>Registrarme</Text>
                            <Ionicons name="person-add-outline" size={20} color="#FFF" />
                          </>
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.switchModeBtn}
                        onPress={() => {
                          setAuthMode('login');
                          setPassword('');
                        }}
                      >
                        <Text style={styles.switchModeText}>
                          ¿Ya tienes cuenta?{' '}
                          <Text style={[styles.switchModeTextBold, { color: theme.primary }]}>
                            Inicia sesión
                          </Text>
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </SafeAreaView>

          <Modal visible={careerModalVisible} animationType="fade" transparent={true}>
            <View style={styles.modalOverlayDark}>
              <View style={styles.modalContentDark}>
                <View style={styles.modalHeaderDark}>
                  <Text style={styles.modalTitleDark}>Departamentos UNLP</Text>
                  <TouchableOpacity onPress={() => setCareerModalVisible(false)}>
                    <Ionicons name="close-circle" size={32} color="#475569" />
                  </TouchableOpacity>
                </View>
                <ScrollView showsVerticalScrollIndicator={false}>
                  {CARRERAS.map((carrera, index) => {
                    const isSpace = SPACE_CAREERS.includes(carrera);
                    return (
                      <TouchableOpacity
                        key={index}
                        style={styles.careerOptionDark}
                        onPress={() => {
                          setUserCareer(carrera);
                          setCareerModalVisible(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.careerOptionTextDark,
                            userCareer === carrera && {
                              color: theme.primary,
                              fontWeight: 'bold',
                            },
                          ]}
                        >
                          {carrera}
                        </Text>
                        {userCareer === carrera && (
                          <Ionicons
                            name={isSpace ? 'planet' : 'flask'}
                            size={24}
                            color={theme.primary}
                          />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </View>
          </Modal>

          <Modal visible={customAlert.visible} transparent={true} animationType="fade">
            <View style={styles.modalOverlayDark}>{renderAlertContent()}</View>
          </Modal>
        </View>
      </TouchableWithoutFeedback>
    );
  }

  // ==========================================
  // PANTALLAS DE CARGA Y AUTENTICACIÓN
  // ==========================================
  if (!hasSeenOnboarding) {
    const slides = [
      {
        id: '1',
        title: 'Tu carrera\na la vista',
        desc: 'Lleva el control de tus materias, cursadas y finales en tiempo real.',
        icon: 'rocket',
      },
      {
        id: '2',
        title: 'Ordena tus\nclases y exámenes',
        desc: 'Crea tu grilla semanal y agendá parciales. Nunca fue tan fácil organizarte.',
        icon: 'calendar',
      },
      {
        id: '3',
        title: 'Y si necesitabas\napuntes para estudiar...',
        desc: 'Accedé a la Tienda y observarás +15000 archivos de material de estudio.',
        icon: 'library',
      },
    ];

    return (
      <View style={{ flex: 1, backgroundColor: '#050519' }}>
        <DynamicBackground />
        <SafeAreaView
          style={{
            position: 'absolute',
            top: Platform.OS === 'android' ? 50 : 60,
            width: '100%',
            alignItems: 'center',
            zIndex: 10,
          }}
        >
          <Text
            style={{
              color: 'rgba(255,255,255,0.5)',
              fontSize: 13,
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: 2,
            }}
          >
            Lo que te ofrece nuestra app
          </Text>
        </SafeAreaView>
        <Animated.ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
            useNativeDriver: false,
          })}
          onMomentumScrollEnd={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.x / width);
            setCurrentSlideIndex(index);
          }}
        >
          {slides.map((slide) => (
            <View
              key={slide.id}
              style={{
                width,
                height: height * 0.85,
                justifyContent: 'center',
                alignItems: 'center',
                paddingHorizontal: width * 0.1,
              }}
            >
              <View
                style={{
                  backgroundColor: theme.primary + '20',
                  padding: 40,
                  borderRadius: 100,
                  marginBottom: 40,
                }}
              >
                <Ionicons name={slide.icon} size={80} color={theme.primary} />
              </View>
              <Text
                style={{
                  fontSize: width * 0.08,
                  fontWeight: '900',
                  color: '#FFF',
                  textAlign: 'center',
                  marginBottom: 20,
                }}
              >
                {slide.title}
              </Text>
              <Text
                style={{
                  fontSize: width * 0.045,
                  color: '#CBD5E1',
                  textAlign: 'center',
                  lineHeight: 28,
                }}
              >
                {slide.desc}
              </Text>
            </View>
          ))}
        </Animated.ScrollView>
        <View
          style={{
            position: 'absolute',
            bottom: height * 0.06,
            width: '100%',
            alignItems: 'center',
          }}
        >
          <View style={{ flexDirection: 'row', marginBottom: 30 }}>
            {slides.map((_, i) => {
              const opacity = scrollX.interpolate({
                inputRange: [(i - 1) * width, i * width, (i + 1) * width],
                outputRange: [0.3, 1, 0.3],
                extrapolate: 'clamp',
              });
              const dotWidth = scrollX.interpolate({
                inputRange: [(i - 1) * width, i * width, (i + 1) * width],
                outputRange: [10, 20, 10],
                extrapolate: 'clamp',
              });
              return (
                <Animated.View
                  key={i}
                  style={{
                    width: dotWidth,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: theme.primary,
                    marginHorizontal: 6,
                    opacity,
                  }}
                />
              );
            })}
          </View>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              if (currentSlideIndex < slides.length - 1) {
                scrollViewRef.current.scrollTo({
                  x: (currentSlideIndex + 1) * width,
                  animated: true,
                });
              } else {
                completeOnboarding();
              }
            }}
            style={[
              styles.loginButton,
              { backgroundColor: theme.primary, width: width * 0.85 },
            ]}
          >
            <Text style={styles.loginButtonText}>
              {currentSlideIndex === slides.length - 1 ? 'Comenzar' : 'Siguiente'}
            </Text>
            <Ionicons name="arrow-forward" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ==========================================
  // 4. APP PRINCIPAL (CONTENIDO TABS)
  // ==========================================
  return (
    <View style={{ flex: 1, backgroundColor: isSpaceTheme ? '#050519' : '#022C22' }}>
      <StatusBar style="light" />
      <DynamicBackground />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.content}>
          {/* ========================================== */}
          {/* TAB 1: PLAN DE ESTUDIOS */}
          {/* ========================================== */}
          {activeTab === 'Plan' && (
            <ScrollView
              style={styles.screenContainer}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={() => loadOfflineOrOnlineData(auth.currentUser?.uid)}
                  tintColor={theme.primary}
                />
              }
            >
              <View style={styles.headerCentered}>
                <View style={{ flexDirection: 'row' }}>
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.selectionAsync();
                      setPomodoroVisible(true);
                    }}
                    style={[
                      styles.avatarPlaceholderDark,
                      { borderColor: theme.bgLight, marginRight: 8 },
                    ]}
                  >
                    <Ionicons name="timer" size={22} color={theme.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.selectionAsync();
                      setNoticesModalVisible(true);
                    }}
                    style={[
                      styles.avatarPlaceholderDark,
                      { borderColor: theme.bgLight },
                    ]}
                  >
                    <Ionicons name="notifications" size={22} color={theme.primary} />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={handleTitleTap}
                  style={{ flex: 1, alignItems: 'center' }}
                >
                  <Text style={[styles.greetingLight, { color: theme.primary, fontSize: 11 }]}>
                    {getGreeting()}
                  </Text>
                  <Text
                    style={[styles.screenTitleLight, { fontSize: width * 0.055 }]}
                    numberOfLines={1}
                  >
                    Plan de Estudios
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setLogoutModalVisible(true)}
                  style={[
                    styles.avatarPlaceholderDark,
                    { borderColor: theme.bgLight },
                  ]}
                >
                  <Ionicons name="log-out" size={22} color="#FCA5A5" />
                </TouchableOpacity>
              </View>

              <View
                style={[
                  styles.progressCardGlass,
                  { borderColor: theme.bgLight, backgroundColor: theme.bgLight },
                ]}
              >
                <View style={styles.progressHeader}>
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text style={styles.progressTitleLight}>{userCareer}</Text>
                    <Text style={[styles.progressDetailDark, { color: theme.primary }]}>
                      {plan.filter((s) => s.completed).length} de {plan.length} finales aprobados
                    </Text>
                  </View>
                  <View style={{ alignItems: 'center' }}>
                    <View
                      style={[
                        styles.percentageCircleDark,
                        { borderColor: theme.primary },
                      ]}
                    >
                      <Text style={styles.progressPercentageLight}>
                        {progressPercentage}%
                      </Text>
                    </View>
                    <Text
                      style={{
                        color: '#94A3B8',
                        fontSize: 10,
                        marginTop: 5,
                        fontWeight: 'bold',
                      }}
                    >
                      PROM: {calculateAverage()}
                    </Text>
                  </View>
                </View>
                <View style={styles.progressBarBgDark}>
                  <View
                    style={[
                      styles.progressBarFillLight,
                      { width: `${progressPercentage}%`, backgroundColor: theme.secondary },
                    ]}
                  />
                </View>
              </View>

              <View style={styles.treeContainer}>
                {Object.keys(planByYear)
                  .sort()
                  .map((yearLabel) => (
                    <View key={yearLabel} style={styles.yearSectionGlass}>
                      <View style={styles.yearHeaderDark}>
                        <Text style={styles.yearTitleLight}>
                          {yearLabel === 'Optativas' ? 'Optativas' : `Año ${yearLabel}`}
                        </Text>
                        <Ionicons name="school" size={18} color="#64748B" />
                      </View>
                      {planByYear[yearLabel].map((subject) => {
                        const unlocked = isSubjectUnlocked(subject);
                        const isOptativa = subject.title.toLowerCase().includes('optativa');
                        const displayTitle = subject.customName || subject.title;

                        return (
                          <TouchableOpacity
                            key={subject.id}
                            style={[
                              styles.subjectRowDark,
                              subject.completed && styles.subjectRowCompletedDark,
                              !unlocked &&
                                !subject.cursada &&
                                !subject.completed &&
                                styles.subjectRowLockedDark,
                            ]}
                            onPress={() => handleSubjectPress(subject)}
                            onLongPress={() => handleLongPressSubject(subject)}
                            activeOpacity={0.7}
                          >
                            <View style={styles.subjectInfo}>
                              <Text
                                style={[
                                  styles.subjectCodeDark,
                                  subject.completed && { color: '#64748B' },
                                  !unlocked && { color: '#475569' },
                                ]}
                              >
                                {subject.id}
                              </Text>
                              <Text
                                style={[
                                  styles.subjectTextLight,
                                  subject.completed && styles.subjectTextCompletedDark,
                                  !unlocked && { color: '#64748B' },
                                ]}
                              >
                                {displayTitle}
                              </Text>

                              {/* Tags inferiores de estado */}
                              <View
                                style={{
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  marginTop: 4,
                                }}
                              >
                                {subject.completed && notas[subject.id] !== undefined && (
                                  <Text
                                    style={{
                                      color: theme.primary,
                                      fontSize: 11,
                                      fontWeight: 'bold',
                                      marginRight: 10,
                                    }}
                                  >
                                    Final: {notas[subject.id]}
                                  </Text>
                                )}
                                {subject.cursada && !subject.completed && (
                                  <Text
                                    style={{
                                      color: '#EAB308',
                                      fontSize: 11,
                                      fontWeight: 'bold',
                                    }}
                                  >
                                    Cursada Aprobada
                                  </Text>
                                )}
                                {isOptativa &&
                                  !subject.customName &&
                                  unlocked &&
                                  !subject.completed &&
                                  !subject.cursada && (
                                    <Text
                                      style={{
                                        color: '#3B82F6',
                                        fontSize: 11,
                                        fontWeight: 'bold',
                                      }}
                                    >
                                      Toca para elegir materia
                                    </Text>
                                  )}
                              </View>
                            </View>

                            {/* CHECKBOX DINÁMICO */}
                            <View
                              style={[
                                styles.checkboxDark,
                                subject.completed && {
                                  backgroundColor: theme.secondary,
                                  borderColor: theme.secondary,
                                },
                                subject.cursada &&
                                  !subject.completed && {
                                    backgroundColor: 'rgba(234, 179, 8, 0.1)',
                                    borderColor: '#EAB308',
                                  },
                                !unlocked &&
                                  !subject.cursada &&
                                  !subject.completed && {
                                    borderColor: '#334155',
                                    backgroundColor: 'transparent',
                                  },
                              ]}
                            >
                              {subject.completed && (
                                <Ionicons name="checkmark" size={14} color="#FFF" />
                              )}
                              {subject.cursada && !subject.completed && (
                                <Ionicons name="time" size={14} color="#EAB308" />
                              )}
                              {!subject.completed &&
                                !subject.cursada &&
                                !unlocked && (
                                  <Ionicons name="lock-closed" size={12} color="#475569" />
                                )}
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ))}
                <View style={{ height: 100 }} />
              </View>
            </ScrollView>
          )}

          {/* ========================================== */}
          {/* TAB 2: HORARIOS (GRILLA) */}
          {/* ========================================== */}
          {activeTab === 'Horarios' && (
            <View
              style={[
                styles.screenContainer,
                {
                  flex: 1,
                  paddingHorizontal: 0,
                  paddingTop: Platform.OS === 'android' ? 40 : 20,
                },
              ]}
            >
              <View style={[styles.header, { paddingHorizontal: width * 0.06 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.greetingLight, { color: theme.primary }]}>
                    Organizador Semanal
                  </Text>
                  <Text
                    style={[styles.screenTitleLight, { fontSize: width * 0.08 }]}
                    numberOfLines={1}
                  >
                    Mis Horarios
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    Haptics.selectionAsync();
                    setNoticesModalVisible(true);
                  }}
                  style={[
                    styles.avatarPlaceholderDark,
                    { borderColor: theme.bgLight },
                  ]}
                >
                  <Ionicons name="notifications" size={22} color={theme.primary} />
                </TouchableOpacity>
              </View>

              <View
                style={[
                  styles.mercadoTabContainer,
                  { marginHorizontal: width * 0.06 },
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.mercadoTabBtn,
                    horariosSubTab === 'grilla' && { backgroundColor: theme.primary },
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setHorariosSubTab('grilla');
                  }}
                >
                  <Ionicons
                    name="grid"
                    size={18}
                    color={horariosSubTab === 'grilla' ? '#FFF' : '#64748B'}
                  />
                  <Text
                    style={[
                      styles.mercadoTabText,
                      horariosSubTab === 'grilla' && { color: '#FFF' },
                    ]}
                  >
                    Grilla
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.mercadoTabBtn,
                    horariosSubTab === 'eventos' && { backgroundColor: theme.primary },
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setHorariosSubTab('eventos');
                  }}
                >
                  <Ionicons
                    name="calendar"
                    size={18}
                    color={horariosSubTab === 'eventos' ? '#FFF' : '#64748B'}
                  />
                  <Text
                    style={[
                      styles.mercadoTabText,
                      horariosSubTab === 'eventos' && { color: '#FFF' },
                    ]}
                  >
                    Eventos
                  </Text>
                </TouchableOpacity>
              </View>

              {horariosSubTab === 'grilla' ? (
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  style={{ flex: 1 }}
                  refreshControl={
                    <RefreshControl
                      refreshing={refreshing}
                      onRefresh={() => loadOfflineOrOnlineData(auth.currentUser?.uid)}
                      tintColor={theme.primary}
                    />
                  }
                >
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: width * 0.03 }}
                  >
                    <View style={styles.gridContainer}>
                      <View style={styles.timeColumn}>
                        <View style={styles.emptyCorner} />
                        {HORAS.map((h) => (
                          <View key={h} style={styles.timeLabelContainer}>
                            <Text style={styles.timeLabelText}>{h}:00</Text>
                          </View>
                        ))}
                      </View>
                      {DIAS_SEMANA.map((dia) => (
                        <View key={dia} style={styles.dayColumn}>
                          <View style={styles.dayColHeader}>
                            <Text style={styles.dayColHeaderText}>
                              {dia.substring(0, 3)}
                            </Text>
                          </View>
                          <View style={styles.dayColBody}>
                            {HORAS.map((h) => (
                              <View key={h} style={styles.gridLine} />
                            ))}
                            {horarios
                              .filter((h) => h.day === dia && !h.isCustom)
                              .map((evento) => {
                                const topPosition = (evento.start - MIN_HORA) * 60;
                                const blockHeight = (evento.end - evento.start) * 60;
                                return (
                                  <TouchableOpacity
                                    key={evento.id}
                                    style={[
                                      styles.eventBlock,
                                      {
                                        top: topPosition,
                                        height: blockHeight,
                                        backgroundColor: evento.color,
                                        zIndex: 10,
                                      },
                                    ]}
                                    delayLongPress={150}
                                    onPress={() => {
                                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                      showAlert(
                                        'Opciones de bloque',
                                        `¿Qué deseas hacer con "${evento.subject}"?`,
                                        [
                                          { text: 'Cancelar', style: 'cancel' },
                                          {
                                            text: 'Eliminar',
                                            style: 'destructive',
                                            onPress: () => removeScheduleItem(evento.id),
                                          },
                                        ]
                                      );
                                    }}
                                    onLongPress={() => {
                                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                                      showAlert(
                                        'Opciones de bloque',
                                        `¿Qué deseas hacer con "${evento.subject}"?`,
                                        [
                                          { text: 'Cancelar', style: 'cancel' },
                                          {
                                            text: 'Eliminar',
                                            style: 'destructive',
                                            onPress: () => removeScheduleItem(evento.id),
                                          },
                                        ]
                                      );
                                    }}
                                  >
                                    <Text style={styles.eventBlockCode}>
                                      {evento.code}
                                    </Text>
                                    <Text style={styles.eventBlockTitle} numberOfLines={3}>
                                      {evento.subject}
                                    </Text>
                                  </TouchableOpacity>
                                );
                              })}
                          </View>
                        </View>
                      ))}
                    </View>
                  </ScrollView>
                  <Text style={styles.hintText}>
                    Toca un bloque para eliminarlo u obtener opciones.
                  </Text>
                  <View style={{ height: 100 }} />
                </ScrollView>
              ) : (
                <ScrollView
                  style={{ flex: 1, paddingHorizontal: width * 0.06 }}
                  refreshControl={
                    <RefreshControl
                      refreshing={refreshing}
                      onRefresh={() => loadOfflineOrOnlineData(auth.currentUser?.uid)}
                      tintColor={theme.primary}
                    />
                  }
                >
                  {horarios.filter((h) => h.isCustom).length > 0 ? (
                    horarios
                      .filter((h) => h.isCustom)
                      .sort(
                        (a, b) =>
                          (a.date ? new Date(a.date).getTime() : 0) -
                          (b.date ? new Date(b.date).getTime() : 0)
                      )
                      .map((evento) => (
                        <View key={evento.id} style={styles.storeCard}>
                          <View style={styles.storeCardHeader}>
                            <View
                              style={[
                                styles.storeIconBox,
                                { backgroundColor: '#EF444420' },
                              ]}
                            >
                              <Ionicons name="warning" size={28} color="#EF4444" />
                            </View>
                            <View style={styles.storeCardTextContainer}>
                              <Text style={styles.storeCardTitle}>{evento.subject}</Text>
                              <Text style={styles.storeCardSubtitle}>
                                {evento.day} {evento.date}
                              </Text>
                            </View>
                            <TouchableOpacity
                              onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                showAlert(
                                  'Eliminar evento',
                                  `¿Seguro que quieres eliminar "${evento.subject}"?`,
                                  [
                                    { text: 'Cancelar', style: 'cancel' },
                                    {
                                      text: 'Eliminar',
                                      style: 'destructive',
                                      onPress: () => removeScheduleItem(evento.id),
                                    },
                                  ]
                                );
                              }}
                            >
                              <Ionicons name="trash" size={24} color="#EF4444" />
                            </TouchableOpacity>
                          </View>
                          <Text style={styles.storeCardDesc}>
                            Horario: {evento.start}:00 a {evento.end}:00 hs.
                          </Text>
                        </View>
                      ))
                  ) : (
                    <View style={styles.emptyDriveBox}>
                      <Ionicons
                        name="calendar-clear-outline"
                        size={50}
                        color="#475569"
                        style={{ marginBottom: 15 }}
                      />
                      <Text style={styles.emptyDriveTitle}>No hay eventos</Text>
                      <Text style={styles.emptyDriveText}>
                        Tus próximos exámenes o entregas aparecerán aquí y se borrarán
                        solos al día siguiente.
                      </Text>
                    </View>
                  )}
                  <View style={{ height: 100 }} />
                </ScrollView>
              )}
              <TouchableOpacity
                style={[
                  styles.fabBtnDark,
                  { backgroundColor: theme.secondary, shadowColor: theme.primary },
                ]}
                onPress={() => {
                  Haptics.impactAsync();
                  setScheduleModalVisible(true);
                }}
              >
                <Ionicons name="add" size={30} color="#FFF" />
              </TouchableOpacity>
            </View>
          )}

          {/* ========================================== */}
          {/* TAB 3: MERCADO DE APUNTES */}
          {/* ========================================== */}
          {activeTab === 'Mercado' &&
            (isStoreLoading ? (
              <View
                style={[
                  styles.screenContainer,
                  { flex: 1, justifyContent: 'center', alignItems: 'center' },
                ]}
              >
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={{ color: theme.primary, marginTop: 15, fontWeight: 'bold' }}>
                  Cargando Tienda...
                </Text>
              </View>
            ) : drivePath.length > 0 && drivePath[drivePath.length - 1] ? (
              <View style={[styles.screenContainer, { flex: 1 }]}>
                <View style={styles.header}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.greetingLight, { color: theme.primary }]}>
                      Visor de Archivos
                    </Text>
                    <Text
                      style={[styles.screenTitleLight, { fontSize: width * 0.08 }]}
                      numberOfLines={1}
                    >
                      Explorador
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.selectionAsync();
                      setNoticesModalVisible(true);
                    }}
                    style={[
                      styles.avatarPlaceholderDark,
                      { borderColor: theme.bgLight },
                    ]}
                  >
                    <Ionicons name="notifications" size={22} color={theme.primary} />
                  </TouchableOpacity>
                </View>
                <View style={styles.driveHeader}>
                  <TouchableOpacity onPress={handleBackDrive} style={styles.driveBackBtn}>
                    <Ionicons name="chevron-back" size={24} color="#FFF" />
                  </TouchableOpacity>
                  <Ionicons
                    name="folder-open"
                    size={20}
                    color={theme.primary}
                    style={{ marginRight: 10 }}
                  />
                  <Text style={styles.driveHeaderText} numberOfLines={1}>
                    {drivePath[drivePath.length - 1].name}
                  </Text>
                </View>
                <ScrollView showsVerticalScrollIndicator={false} style={styles.driveBody}>
                  {drivePath[drivePath.length - 1].children &&
                    drivePath[drivePath.length - 1].children.map((item, index) => {
                      const isFolder = item.type === 'folder';
                      const fileStyle = isFolder ? null : getFileStyle(item.name);
                      const itemColor = isFolder ? theme.primary : fileStyle.color;
                      const itemIcon = isFolder ? 'folder' : fileStyle.icon;

                      return (
                        <TouchableOpacity
                          key={index}
                          style={styles.driveItemRow}
                          onPress={() => renderDriveNode(item)}
                        >
                          <View
                            style={[
                              styles.driveItemIconBox,
                              { backgroundColor: itemColor + '20' },
                            ]}
                          >
                            <Ionicons name={itemIcon} size={24} color={itemColor} />
                          </View>
                          <Text style={styles.driveItemText} numberOfLines={2}>
                            {item.name}
                          </Text>
                          {isFolder && (
                            <Ionicons name="chevron-forward" size={20} color="#475569" />
                          )}
                          {!isFolder && (
                            <Ionicons name="open-outline" size={20} color={itemColor} />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  {(!drivePath[drivePath.length - 1].children ||
                    drivePath[drivePath.length - 1].children.length === 0) && (
                    <View style={styles.emptyDriveBox}>
                      <Ionicons
                        name="file-tray"
                        size={40}
                        color="#475569"
                        style={{ marginBottom: 10 }}
                      />
                      <Text style={styles.emptyDriveText}>Esta carpeta está vacía.</Text>
                    </View>
                  )}
                  <View style={{ height: 100 }} />
                </ScrollView>
              </View>
            ) : (
              <View style={[styles.screenContainer, { flex: 1 }]}>
                <View style={styles.header}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.greetingLight, { color: theme.primary }]}>
                      Tu Biblioteca
                    </Text>
                    <Text
                      style={[styles.screenTitleLight, { fontSize: width * 0.08 }]}
                      numberOfLines={1}
                    >
                      Drive Exactas
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.selectionAsync();
                      setNoticesModalVisible(true);
                    }}
                    style={[
                      styles.avatarPlaceholderDark,
                      { borderColor: theme.bgLight },
                    ]}
                  >
                    <Ionicons name="notifications" size={22} color={theme.primary} />
                  </TouchableOpacity>
                </View>
                <View style={styles.mercadoTabContainer}>
                  <TouchableOpacity
                    style={[
                      styles.mercadoTabBtn,
                      mercadoSubTab === 'tienda' && { backgroundColor: theme.primary },
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setMercadoSubTab('tienda');
                      setDrivePath([]);
                    }}
                  >
                    <Ionicons
                      name="cart"
                      size={18}
                      color={mercadoSubTab === 'tienda' ? '#FFF' : '#64748B'}
                    />
                    <Text
                      style={[
                        styles.mercadoTabText,
                        mercadoSubTab === 'tienda' && { color: '#FFF' },
                      ]}
                    >
                      Tienda
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.mercadoTabBtn,
                      mercadoSubTab === 'mis_apuntes' && {
                        backgroundColor: theme.primary,
                      },
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setMercadoSubTab('mis_apuntes');
                      setDrivePath([]);
                    }}
                  >
                    <Ionicons
                      name="book"
                      size={18}
                      color={mercadoSubTab === 'mis_apuntes' ? '#FFF' : '#64748B'}
                    />
                    <Text
                      style={[
                        styles.mercadoTabText,
                        mercadoSubTab === 'mis_apuntes' && { color: '#FFF' },
                      ]}
                    >
                      Mis Apuntes
                    </Text>
                  </TouchableOpacity>
                </View>
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  style={{ flex: 1, marginTop: 10 }}
                  refreshControl={
                    <RefreshControl
                      refreshing={refreshing}
                      onRefresh={() => loadOfflineOrOnlineData(auth.currentUser?.uid)}
                      tintColor={theme.primary}
                    />
                  }
                >
                  {mercadoSubTab === 'tienda' && (
                    <View>
                      <View style={styles.filterRow}>
                        {['ALL', 'FHOM', 'CIBEX'].map((f) => (
                          <TouchableOpacity
                            key={f}
                            style={[
                              styles.filterChip,
                              storeFilter === f && {
                                borderColor: theme.primary,
                                backgroundColor: theme.primary + '20',
                              },
                            ]}
                            onPress={() => {
                              Haptics.selectionAsync();
                              setStoreFilter(f);
                            }}
                          >
                            <Text
                              style={[
                                styles.filterChipText,
                                storeFilter === f && { color: theme.primary },
                              ]}
                            >
                              {f === 'ALL' ? 'Todos' : f}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                      {isProcessingPayment && (
                        <View
                          style={{
                            backgroundColor: theme.secondary + '30',
                            padding: 15,
                            borderRadius: 15,
                            marginBottom: 15,
                            flexDirection: 'row',
                            alignItems: 'center',
                          }}
                        >
                          <ActivityIndicator
                            color={theme.primary}
                            style={{ marginRight: 10 }}
                          />
                          <Text style={{ color: '#FFF', fontWeight: 'bold' }}>
                            Procesando pago, aguarde...
                          </Text>
                        </View>
                      )}
                      {(storeFilter === 'ALL'
                        ? tiendaData
                        : tiendaData.filter((item) => item.category === storeFilter)
                      ).map((pack) => {
                        const yaComprado = misApuntes.includes(pack.id);
                        const peekData = getSneakPeekData(pack.title);

                        return (
                          <View key={pack.id} style={styles.storeCard}>
                            <View style={styles.storeCardHeader}>
                              <View
                                style={[
                                  styles.storeIconBox,
                                  { backgroundColor: theme.primary + '20' },
                                ]}
                              >
                                <Ionicons
                                  name={pack.icon || 'folder'}
                                  size={28}
                                  color={theme.primary}
                                />
                              </View>
                              <View style={styles.storeCardTextContainer}>
                                <Text style={styles.storeCardTitle} numberOfLines={2}>
                                  {pack.title}
                                </Text>
                                <Text style={styles.storeCardSubtitle}>
                                  {pack.category}
                                </Text>
                              </View>
                            </View>
                            <Text style={styles.storeCardDesc}>
                              Incluye: {pack.subjects}
                            </Text>
                            <View style={styles.storeCardFooter}>
                              <Text style={styles.storePrice}>${pack.price}</Text>
                              {yaComprado ? (
                                <View
                                  style={[
                                    styles.storeBuyBtn,
                                    { backgroundColor: '#475569' },
                                  ]}
                                >
                                  <Text style={styles.storeBuyBtnText}>Adquirido</Text>
                                </View>
                              ) : (
                                <View style={{ flexDirection: 'row' }}>
                                  {peekData && (
                                    <TouchableOpacity
                                      style={[
                                        styles.storeBuyBtn,
                                        { backgroundColor: '#334155', marginRight: 10 },
                                      ]}
                                      onPress={() => handleSneakPeek(pack.title)}
                                    >
                                      <Ionicons name="eye" size={18} color="#FFF" />
                                    </TouchableOpacity>
                                  )}
                                  <TouchableOpacity
                                    style={[
                                      styles.storeBuyBtn,
                                      { backgroundColor: theme.secondary },
                                    ]}
                                    onPress={() => handleBuyButtonPress(pack)}
                                    disabled={isProcessingPayment}
                                  >
                                    <Text style={styles.storeBuyBtnText}>Comprar</Text>
                                    <Ionicons
                                      name="cart-outline"
                                      size={16}
                                      color="#FFF"
                                      style={{ marginLeft: 5 }}
                                    />
                                  </TouchableOpacity>
                                </View>
                              )}
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  )}
                  {mercadoSubTab === 'mis_apuntes' && (
                    <View>
                      {misApuntes.length > 0 ? (
                        tiendaData
                          .filter((p) => misApuntes.includes(p.id))
                          .map((pack) => (
                            <View
                              key={pack.id}
                              style={[
                                styles.storeCard,
                                { borderColor: theme.primary + '50' },
                              ]}
                            >
                              <View style={styles.storeCardHeader}>
                                <View
                                  style={[
                                    styles.storeIconBox,
                                    { backgroundColor: theme.secondary + '30' },
                                  ]}
                                >
                                  <Ionicons
                                    name="folder-open"
                                    size={28}
                                    color={theme.primary}
                                  />
                                </View>
                                <View style={styles.storeCardTextContainer}>
                                  <Text
                                    style={styles.storeCardTitle}
                                    numberOfLines={2}
                                  >
                                    {pack.title}
                                  </Text>
                                  <Text style={styles.storeCardSubtitle}>
                                    Acceso desbloqueado
                                  </Text>
                                </View>
                              </View>
                              <TouchableOpacity
                                style={[
                                  styles.storeBuyBtn,
                                  {
                                    backgroundColor: theme.primary,
                                    width: '100%',
                                    justifyContent: 'center',
                                    marginTop: 10,
                                  },
                                ]}
                                onPress={() => renderDriveNode(pack.driveTree)}
                              >
                                <Text style={styles.storeBuyBtnText}>
                                  Abrir Carpeta
                                </Text>
                                <Ionicons
                                  name="arrow-forward-outline"
                                  size={18}
                                  color="#FFF"
                                  style={{ marginLeft: 8 }}
                                />
                              </TouchableOpacity>
                            </View>
                          ))
                      ) : (
                        <View style={styles.emptyDriveBox}>
                          <Ionicons
                            name="folder-open-outline"
                            size={50}
                            color="#475569"
                            style={{ marginBottom: 15 }}
                          />
                          <Text style={styles.emptyDriveTitle}>
                            Tu biblioteca está vacía
                          </Text>
                          <Text style={styles.emptyDriveText}>
                            Desliza hacia abajo para actualizar si acabaste de comprar
                            algo, o explora la tienda.
                          </Text>
                          <TouchableOpacity
                            style={[
                              styles.storeBuyBtn,
                              { backgroundColor: theme.secondary, marginTop: 20 },
                            ]}
                            onPress={() => setMercadoSubTab('tienda')}
                          >
                            <Text style={styles.storeBuyBtnText}>Ir a la Tienda</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  )}
                  <View style={{ height: 100 }} />
                </ScrollView>
              </View>
            ))}
        </View>

        {/* BOTTOM NAV BAR */}
        <View style={styles.bottomNavDark}>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => switchTab('Horarios')}
          >
            <Ionicons
              name={activeTab === 'Horarios' ? 'time' : 'time-outline'}
              size={26}
              color={activeTab === 'Horarios' ? theme.primary : '#64748B'}
            />
            <Text
              style={[
                styles.navTextDark,
                activeTab === 'Horarios' && { color: theme.primary, fontWeight: '900' },
              ]}
            >
              Horarios
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => switchTab('Plan')}>
            <View
              style={[
                styles.navCenterBtnDark,
                activeTab === 'Plan' && {
                  backgroundColor: theme.secondary,
                  shadowColor: theme.primary,
                  borderColor: theme.primary,
                  elevation: 6,
                },
              ]}
            >
              <Ionicons
                name="git-network"
                size={28}
                color={activeTab === 'Plan' ? '#FFF' : '#94A3B8'}
              />
            </View>
            <Text
              style={[
                styles.navTextDark,
                activeTab === 'Plan' && { color: theme.primary, fontWeight: '900' },
                { marginTop: 5 },
              ]}
            >
              Plan
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => switchTab('Mercado')}
          >
            <Ionicons
              name={activeTab === 'Mercado' ? 'library' : 'library-outline'}
              size={26}
              color={activeTab === 'Mercado' ? theme.primary : '#64748B'}
            />
            <Text
              style={[
                styles.navTextDark,
                activeTab === 'Mercado' && { color: theme.primary, fontWeight: '900' },
              ]}
            >
              Apuntes
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* 🌟 VISOR UNIVERSAL DE DOCUMENTOS SEGURO (ANTI-CAPTURA) 🌟 */}
      <Modal animationType="slide" transparent={false} visible={pdfViewerVisible} onRequestClose={closePdfViewer}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#0F172A' }}>
          {/* Header del visor */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, borderBottomWidth: 1, borderBottomColor: '#334155' }}>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', paddingRight: 15 }}>
              <Ionicons name="document-lock" size={24} color="#34D399" style={{ marginRight: 10 }} />
              <Text style={{ flex: 1, color: '#FFF', fontSize: 16, fontWeight: 'bold' }} numberOfLines={1} ellipsizeMode="tail">
                {currentPdfNode?.name || 'Documento Seguro'}
              </Text>
            </View>
            <TouchableOpacity onPress={closePdfViewer} style={{ paddingHorizontal: 15, paddingVertical: 8, backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)' }}>
              <Text style={{ color: '#EF4444', fontWeight: 'bold' }}>Cerrar</Text>
            </TouchableOpacity>
          </View>

          {/* El WebView que carga Drive de forma oculta */}
          {currentPdfNode?.url && (
            <WebView
              source={{ uri: currentPdfNode.url }}
              style={{ flex: 1, backgroundColor: '#0F172A' }}
              startInLoadingState={true}
              renderLoading={() => (
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F172A' }}>
                  <ActivityIndicator size="large" color={theme.primary} />
                  <Text style={{ color: '#94A3B8', marginTop: 10, fontWeight: 'bold' }}>Cargando visor seguro...</Text>
                </View>
              )}
            />
          )}
        </SafeAreaView>
      </Modal>

      {/* MODAL DEL TIMER POMODORO */}
      <Modal animationType="fade" transparent={true} visible={pomodoroVisible}>
        <View style={styles.modalOverlayDark}>
          <View style={[styles.modalContentDark, { alignItems: 'center' }]}>
            <View style={[styles.modalHeaderDark, { width: '100%' }]}>
              <Text style={styles.modalTitleDark}>Modo Concentración</Text>
              <TouchableOpacity onPress={() => setPomodoroVisible(false)}>
                <Ionicons name="close-circle" size={32} color="#475569" />
              </TouchableOpacity>
            </View>
            <View
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                padding: 30,
                borderRadius: 100,
                marginBottom: 20,
                borderWidth: 4,
                borderColor: timerActive ? theme.primary : '#334155',
              }}
            >
              <Text style={{ fontSize: 50, fontWeight: '900', color: '#FFF' }}>
                {formatTime(timeLeft)}
              </Text>
            </View>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-around',
                width: '100%',
                paddingHorizontal: 20,
              }}
            >
              <TouchableOpacity
                style={[
                  styles.sheetSaveBtnDark,
                  {
                    backgroundColor: timerActive ? '#EF4444' : theme.secondary,
                    flex: 1,
                    marginRight: 10,
                  },
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setTimerActive(!timerActive);
                }}
              >
                <Text style={styles.sheetSaveText}>
                  {timerActive ? 'Pausar' : 'Iniciar'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.sheetSaveBtnDark,
                  { backgroundColor: '#334155', flex: 1, marginLeft: 10 },
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setTimeLeft(25 * 60);
                  setTimerActive(false);
                }}
              >
                <Text style={styles.sheetSaveText}>Reiniciar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL DE SELECCIÓN DE OPTATIVAS */}
      <Modal animationType="slide" transparent={true} visible={optativaModalVisible}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlayDark}
        >
          <View style={[styles.modalSheetDark, { maxHeight: height * 0.8 }]}>
            <View style={styles.sheetHandleDark} />
            <Text style={styles.sheetTitleLight}>Elegir Optativa</Text>
            <Text style={{ color: '#94A3B8', marginBottom: 20 }}>
              Selecciona o escribe el nombre de la materia optativa que vas a cursar en este espacio.
            </Text>

            <TextInput
              style={[styles.sheetInputDark, { marginBottom: 15 }]}
              placeholder="Nombre de la Optativa..."
              placeholderTextColor="#64748B"
              value={customOptativaText}
              onChangeText={setCustomOptativaText}
            />

            <Text style={[styles.sheetLabelDark, { marginBottom: 10 }]}>
              Sugerencias del Plan de Estudios:
            </Text>
            <ScrollView
              style={{ maxHeight: 200, marginBottom: 20 }}
              showsVerticalScrollIndicator={false}
            >
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {listaSugeridaDeOptativas
                  .filter(
                    (opt) =>
                      !Object.values(optativasNames).includes(opt) ||
                      opt === customOptativaText
                  )
                  .map((opt, i) => (
                    <TouchableOpacity
                      key={i}
                      style={[
                        styles.filterChip,
                        {
                          marginBottom: 10,
                          backgroundColor:
                            customOptativaText === opt
                              ? theme.primary
                              : 'rgba(30, 41, 59, 0.8)',
                        },
                      ]}
                      onPress={() => setCustomOptativaText(opt)}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          customOptativaText === opt && { color: '#FFF' },
                        ]}
                      >
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  ))}
                {listaSugeridaDeOptativas.filter(
                  (opt) => !Object.values(optativasNames).includes(opt)
                ).length === 0 && (
                  <Text style={{ color: '#64748B', fontStyle: 'italic' }}>
                    Ya elegiste todas las sugerencias. Ingresa el nombre manualmente arriba.
                  </Text>
                )}
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[styles.sheetSaveBtnDark, { backgroundColor: theme.secondary }]}
              onPress={() => saveOptativaName(customOptativaText)}
            >
              <Text style={styles.sheetSaveText}>Guardar Optativa</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.sheetCancelBtn}
              onPress={() => setOptativaModalVisible(false)}
            >
              <Text style={styles.sheetCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* 🌟 MODAL DE NOTAS Y CURSADAS (NUEVO DISEÑO MINIMALISTA) 🌟 */}
      <Modal animationType="fade" transparent={true} visible={gradeModalVisible}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlayDark}
        >
          <View style={styles.modalContentDark}>
            <View style={styles.modalHeaderDark}>
              <Text style={styles.modalTitleDark}>Estado de Materia</Text>
              <TouchableOpacity onPress={() => setGradeModalVisible(false)}>
                <Ionicons name="close-circle" size={32} color="#475569" />
              </TouchableOpacity>
            </View>

            <Text
              style={{ color: '#CBD5E1', fontSize: 15, marginBottom: 20, textAlign: 'center' }}
            >
              {pendingSubject?.customName || pendingSubject?.title}
            </Text>

            {/* BLOQUE PRINCIPAL: FINAL (Diseño Horizontal y Compacto) */}
            <View
              style={{
                backgroundColor: 'rgba(30, 41, 59, 0.5)',
                padding: 20,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: '#334155',
                marginBottom: 15,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 15,
                }}
              >
                <Text style={{ color: '#E2E8F0', fontWeight: '700', fontSize: 16 }}>
                  Aprobé el Final con:
                </Text>
                <TextInput
                  style={{
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    borderWidth: 1,
                    borderColor: '#475569',
                    borderRadius: 12,
                    color: '#FFF',
                    fontSize: 18,
                    fontWeight: 'bold',
                    textAlign: 'center',
                    width: 65,
                    paddingVertical: 8,
                  }}
                  placeholder="-"
                  placeholderTextColor="#64748B"
                  keyboardType="numeric"
                  maxLength={2}
                  value={tempGrade}
                  onChangeText={(t) => setTempGrade(t.replace(/[^0-9]/g, ''))}
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.sheetSaveBtnDark,
                  { backgroundColor: theme.secondary, marginTop: 0, paddingVertical: 14 },
                ]}
                onPress={() => {
                  if (tempGrade === '' || parseInt(tempGrade) < 1 || parseInt(tempGrade) > 10)
                    return showAlert('Nota Inválida', 'Ingresa un número del 1 al 10');
                  submitGrade('final');
                }}
              >
                <Text style={[styles.sheetSaveText, { fontSize: 15 }]}>
                  Guardar Final
                </Text>
              </TouchableOpacity>
            </View>

            {/* BLOQUE SECUNDARIO: SOLO CURSADA (Diseño de Botón Moderno) */}
            {!pendingSubject?.cursada && (
              <TouchableOpacity
                style={{
                  backgroundColor: 'rgba(234, 179, 8, 0.1)',
                  paddingVertical: 14,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: 'rgba(234, 179, 8, 0.3)',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
                onPress={() => submitGrade('cursada')}
              >
                <Ionicons name="time-outline" size={20} color="#EAB308" style={{ marginRight: 8 }} />
                <Text style={{ color: '#EAB308', fontWeight: 'bold', fontSize: 15 }}>
                  Aprobé solo la Cursada
                </Text>
              </TouchableOpacity>
            )}

            {/* BOTÓN ANULAR CURSADA */}
            {pendingSubject?.cursada && !pendingSubject?.completed && (
              <TouchableOpacity
                style={{
                  marginTop: 15,
                  paddingVertical: 12,
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: 'rgba(239, 68, 68, 0.3)',
                }}
                onPress={() => {
                  setGradeModalVisible(false);
                  undoStatus(pendingSubject, 'to_pending');
                }}
              >
                <Text
                  style={{
                    color: '#EF4444',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    fontSize: 15,
                  }}
                >
                  Anular Cursada
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* 🔥 MODAL PAGO ÚNICO (MERCADO PAGO) 🔥 */}
      <Modal animationType="slide" transparent={true} visible={paymentModalVisible}>
        <View style={styles.modalOverlayDark}>
          <View style={styles.modalSheetDark}>
            <View style={styles.sheetHandleDark} />
            <Text style={styles.sheetTitleLight}>Completar Compra</Text>
            <Text style={{ color: '#94A3B8', marginBottom: 25, lineHeight: 22 }}>
              Estás a punto de adquirir <Text style={{color: '#FFF', fontWeight: 'bold'}}>"{selectedPackForPayment?.title}"</Text>. El pago se procesará de forma segura a través de Mercado Pago (acepta tarjetas de crédito, débito y dinero en cuenta).
            </Text>

            <TouchableOpacity
              style={[
                styles.loginButton,
                { backgroundColor: '#009EE3', shadowColor: '#009EE3', marginBottom: 15 },
              ]}
              onPress={() => procesarCompra(selectedPackForPayment)}
            >
              <Ionicons name="bag-check" size={24} color="#FFF" style={{ marginRight: 10 }} />
              <Text style={[styles.loginButtonText, { flex: 1 }]}>Pagar con Mercado Pago</Text>
              <Ionicons name="chevron-forward" size={20} color="#FFF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sheetCancelBtn}
              onPress={() => setPaymentModalVisible(false)}
            >
              <Text style={styles.sheetCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL DISCLAIMER LEGAL (PRIMER INGRESO A LA TIENDA) */}
      <Modal animationType="fade" transparent={true} visible={showDisclaimer}>
        <View style={styles.modalOverlayDark}>
          <View style={styles.modalContentDark}>
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <Ionicons name="information-circle" size={60} color={theme.primary} />
              <Text style={[styles.modalTitleDark, { marginTop: 10, textAlign: 'center' }]}>
                Aviso Legal
              </Text>
            </View>
            <ScrollView
              style={{ maxHeight: height * 0.4 }}
              showsVerticalScrollIndicator={false}
            >
              <Text
                style={{
                  color: '#CBD5E1',
                  fontSize: 15,
                  lineHeight: 24,
                  textAlign: 'justify',
                }}
              >
                <Text style={{ fontWeight: 'bold', color: '#FFF' }}>
                  Universo Exactas
                </Text>{' '}
                es una iniciativa independiente gestionada por estudiantes. Es importante aclarar que el monto abonado por los packs corresponde estrictamente al{' '}
                <Text style={{ fontWeight: 'bold', color: '#FFF' }}>
                  servicio de recopilación, organización, curaduría y mantenimiento
                </Text>{' '}
                de la infraestructura digital necesaria para brindar acceso inmediato al material.
                {'\n\n'}
                No se comercializa ni se reclama la propiedad intelectual de los archivos aquí listados, los cuales se encuentran disponibles de forma pública en diversos portales web y repositorios abiertos para su libre búsqueda individual.
              </Text>
            </ScrollView>
            <TouchableOpacity
              style={[
                styles.sheetSaveBtnDark,
                { backgroundColor: theme.secondary, marginTop: 25 },
              ]}
              onPress={async () => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                setShowDisclaimer(false);
                setDisclaimerAccepted(true);
                if (auth.currentUser) {
                  await setDoc(
                    doc(db, 'usuarios', auth.currentUser.uid),
                    { disclaimerAccepted: true },
                    { merge: true }
                  ).catch(() => {});
                }
              }}
            >
              <Text style={styles.sheetSaveText}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL DE AVISOS COMUNITARIOS */}
      <Modal animationType="slide" transparent={true} visible={noticesModalVisible}>
        <View style={styles.modalOverlayDark}>
          <View style={[styles.modalSheetDark, { maxHeight: '70%', paddingBottom: 20 }]}>
            <View style={styles.sheetHandleDark} />
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
              <Ionicons
                name="megaphone"
                size={28}
                color={theme.primary}
                style={{ marginRight: 10 }}
              />
              <Text style={styles.sheetTitleLight}>Avisos Comunitarios</Text>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {avisos.map((aviso) => (
                <View
                  key={aviso.id}
                  style={{
                    backgroundColor: 'rgba(30, 41, 59, 0.8)',
                    padding: 15,
                    borderRadius: 16,
                    marginBottom: 15,
                    borderWidth: 1,
                    borderColor: '#334155',
                  }}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      marginBottom: 8,
                    }}
                  >
                    <Text
                      style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16, flex: 1 }}
                    >
                      {aviso.title}
                    </Text>
                    <Text style={{ color: theme.primary, fontSize: 12, fontWeight: 'bold' }}>
                      {aviso.date}
                    </Text>
                  </View>
                  <Text style={{ color: '#CBD5E1', lineHeight: 22 }}>{aviso.desc}</Text>
                </View>
              ))}
              {avisos.length === 0 && (
                <Text style={{ color: '#64748B', textAlign: 'center', marginTop: 20 }}>
                  No hay avisos nuevos.
                </Text>
              )}
            </ScrollView>
            <TouchableOpacity
              style={[styles.sheetSaveBtnDark, { backgroundColor: '#334155', marginTop: 15 }]}
              onPress={() => setNoticesModalVisible(false)}
            >
              <Text style={{ color: '#FFF', fontWeight: 'bold', textAlign: 'center' }}>
                Cerrar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Horarios y Parciales */}
      <Modal animationType="slide" transparent={true} visible={scheduleModalVisible}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlayDark}
        >
          <View style={styles.modalSheetDark}>
            <View style={styles.sheetHandleDark} />
            <Text style={styles.sheetTitleLight}>Agenda</Text>
            <View
              style={{
                flexDirection: 'row',
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                borderRadius: 12,
                padding: 5,
                marginBottom: 20,
              }}
            >
              <TouchableOpacity
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  alignItems: 'center',
                  borderRadius: 8,
                  backgroundColor: scheduleEntryMode === 'materia' ? theme.primary : 'transparent',
                }}
                onPress={() => {
                  Haptics.selectionAsync();
                  setScheduleEntryMode('materia');
                }}
              >
                <Text
                  style={{
                    fontWeight: 'bold',
                    color: scheduleEntryMode === 'materia' ? '#FFF' : '#64748B',
                  }}
                >
                  Materia Regular
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  alignItems: 'center',
                  borderRadius: 8,
                  backgroundColor: scheduleEntryMode === 'evento' ? '#EF4444' : 'transparent',
                }}
                onPress={() => {
                  Haptics.selectionAsync();
                  setScheduleEntryMode('evento');
                }}
              >
                <Text
                  style={{
                    fontWeight: 'bold',
                    color: scheduleEntryMode === 'evento' ? '#FFF' : '#64748B',
                  }}
                >
                  Parcial / Entrega
                </Text>
              </TouchableOpacity>
            </View>
            {scheduleEntryMode === 'materia' ? (
              <>
                <Text style={styles.sheetLabelDark}>Materias disponibles para cursar:</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ marginBottom: 25, maxHeight: 50 }}
                >
                  {availableSubjects.length > 0 ? (
                    availableSubjects.map((s) => (
                      <TouchableOpacity
                        key={s.id}
                        style={[
                          styles.subjectChip,
                          newSubject?.id === s.id && {
                            backgroundColor: theme.primary,
                            borderColor: theme.primary,
                          },
                        ]}
                        onPress={() => setNewSubject(s)}
                      >
                        <Text
                          style={[
                            styles.subjectChipText,
                            newSubject?.id === s.id && { color: '#FFF', fontWeight: 'bold' },
                          ]}
                        >
                          {s.customName || s.title}
                        </Text>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <Text
                      style={{
                        color: '#64748B',
                        alignSelf: 'center',
                        fontStyle: 'italic',
                        marginTop: 10,
                      }}
                    >
                      No hay materias desbloqueadas.
                    </Text>
                  )}
                </ScrollView>
                <Text style={styles.sheetLabelDark}>Día de la semana:</Text>
                <View style={styles.daysRow}>
                  {DIAS_SEMANA.map((d) => (
                    <TouchableOpacity
                      key={d}
                      style={[
                        styles.dayQuickBtn,
                        newDay === d && {
                          backgroundColor: theme.primary,
                          borderColor: theme.primary,
                        },
                      ]}
                      onPress={() => setNewDay(d)}
                    >
                      <Text
                        style={[
                          styles.dayQuickBtnText,
                          newDay === d && { color: '#FFF', fontWeight: 'bold' },
                        ]}
                      >
                        {d.substring(0, 3)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            ) : (
              <>
                <Text style={styles.sheetLabelDark}>Título (Ej: Parcial Física I):</Text>
                <TextInput
                  style={[styles.sheetInputDark, { marginBottom: 15 }]}
                  placeholder="Nombre del evento"
                  placeholderTextColor="#64748B"
                  value={customEventTitle}
                  onChangeText={setCustomEventTitle}
                  maxLength={30}
                />
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                    marginBottom: 5,
                  }}
                >
                  <Text style={styles.sheetLabelDark}>Fecha de la Evaluación:</Text>
                  <TouchableOpacity
                    onPress={() => {
                      const hoy = new Date();
                      const str =
                        hoy.getFullYear() +
                        '-' +
                        String(hoy.getMonth() + 1).padStart(2, '0') +
                        '-' +
                        String(hoy.getDate()).padStart(2, '0');
                      setCustomEventDate(str);
                    }}
                  >
                    <Text
                      style={{
                        color: theme.primary,
                        fontWeight: 'bold',
                        fontSize: 14,
                        marginBottom: 12,
                      }}
                    >
                      Hoy
                    </Text>
                  </TouchableOpacity>
                </View>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: 'rgba(30, 41, 59, 0.8)',
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: '#334155',
                    paddingHorizontal: 16,
                    marginBottom: 25,
                  }}
                >
                  <Ionicons name="calendar" size={20} color="#64748B" style={{ marginRight: 10 }} />
                  <TextInput
                    style={{ flex: 1, color: '#FFF', fontSize: 16, paddingVertical: 16 }}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#64748B"
                    value={customEventDate}
                    onChangeText={(text) => {
                      let formatted = text.replace(/[^0-9-]/g, '');
                      if (formatted.length === 4 && customEventDate.length === 3)
                        formatted += '-';
                      if (formatted.length === 7 && customEventDate.length === 6)
                        formatted += '-';
                      setCustomEventDate(formatted);
                    }}
                    maxLength={10}
                    keyboardType="numeric"
                  />
                </View>
              </>
            )}
            <View style={styles.sheetInputGroup}>
              <Text style={styles.sheetLabelDark}>Horario del Evento/Clase:</Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <TextInput
                  style={[styles.sheetInputDark, { flex: 1, textAlign: 'center' }]}
                  placeholder="Inicio"
                  placeholderTextColor="#64748B"
                  keyboardType="numeric"
                  value={newStartTime}
                  onChangeText={setNewStartTime}
                />
                <Text style={{ color: '#94A3B8', paddingHorizontal: 15, fontWeight: 'bold' }}>
                  hasta
                </Text>
                <TextInput
                  style={[styles.sheetInputDark, { flex: 1, textAlign: 'center' }]}
                  placeholder="Fin"
                  placeholderTextColor="#64748B"
                  keyboardType="numeric"
                  value={newEndTime}
                  onChangeText={setNewEndTime}
                />
              </View>
            </View>
            <TouchableOpacity
              style={[
                styles.sheetSaveBtnDark,
                { backgroundColor: scheduleEntryMode === 'evento' ? '#EF4444' : theme.secondary },
              ]}
              onPress={addToSchedule}
            >
              <Text style={styles.sheetSaveText}>
                {scheduleEntryMode === 'evento' ? 'Programar Alarma' : 'Guardar'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.sheetCancelBtn}
              onPress={() => setScheduleModalVisible(false)}
            >
              <Text style={styles.sheetCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal animationType="fade" transparent={true} visible={logoutModalVisible}>
        <View style={styles.modalOverlayDark}>
          <View style={[styles.modalContentDark, { alignItems: 'center', paddingVertical: 40 }]}>
            <Ionicons name="log-out-outline" size={60} color="#FCA5A5" style={{ marginBottom: 20 }} />
            <Text style={[styles.modalTitleDark, { textAlign: 'center', marginBottom: 10 }]}>
              ¿Cerrar Sesión?
            </Text>
            <Text
              style={{
                color: '#94A3B8',
                fontSize: 16,
                textAlign: 'center',
                marginBottom: 30,
                paddingHorizontal: 10,
              }}
            >
              Tendrás que volver a ingresar tus credenciales para acceder a tus materias y
              horarios.
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
              <TouchableOpacity
                style={[
                  styles.sheetCancelBtn,
                  {
                    flex: 1,
                    backgroundColor: 'rgba(30, 41, 59, 0.8)',
                    borderRadius: 16,
                    marginRight: 10,
                  },
                ]}
                onPress={() => {
                  Haptics.impactAsync();
                  setLogoutModalVisible(false);
                }}
              >
                <Text style={styles.sheetCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.sheetSaveBtnDark,
                  { flex: 1, backgroundColor: '#EF4444', marginTop: 0 },
                ]}
                onPress={() => {
                  Haptics.impactAsync();
                  handleLogout();
                  setLogoutModalVisible(false);
                }}
              >
                <Text style={[styles.sheetSaveText, { fontSize: 16 }]}>Sí, salir</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  screenContainer: {
    paddingHorizontal: width * 0.06,
    paddingTop: Platform.OS === 'android' ? 40 : 20,
  },
  authScrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: width * 0.08,
    paddingVertical: Platform.OS === 'android' ? 60 : 40,
  },
  nebula: {
    position: 'absolute',
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    opacity: 0.25,
    filter: 'blur(60px)',
  },
  shootingStar: {
    position: 'absolute',
    width: 100,
    height: 2,
    backgroundColor: '#FFF',
    borderRadius: 2,
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: height * 0.05,
  },
  authTitleLine1: {
    fontSize: width * 0.1,
    fontWeight: '300',
    color: '#FFF',
    letterSpacing: 8,
    marginBottom: -10,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  authTitleLine2: {
    fontSize: width * 0.12,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 2,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 15,
  },
  authSubtitle: {
    fontSize: width * 0.035,
    marginTop: 15,
    fontWeight: '600',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  authModeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  switchModeBtn: {
    marginTop: 20,
    alignItems: 'center',
    paddingVertical: 10,
  },
  switchModeText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
  switchModeTextBold: {
    fontWeight: '900',
  },
  glassCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    padding: width * 0.06,
    borderRadius: 30,
    borderWidth: 1,
  },
  unifiedInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 16 : 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#334155',
    minHeight: 55,
  },
  unifiedInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 16,
    padding: 0,
  },
  inputIcon: {
    marginRight: 12,
  },
  selectorTextDark: {
    fontSize: 16,
    color: '#FFF',
  },
  customAlertCard: {
    backgroundColor: '#0F172A',
    borderRadius: 24,
    padding: width * 0.06,
    width: '90%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  alertIconBubble: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  alertTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFF',
    marginBottom: 10,
    textAlign: 'center',
  },
  alertMessage: {
    fontSize: 15,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 25,
  },
  alertButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  alertBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  alertBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    padding: 18,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
  },
  loginButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '900',
    marginRight: 10,
    letterSpacing: 1,
  },
  modalOverlayDark: {
    flex: 1,
    backgroundColor: 'rgba(5, 5, 25, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: width * 0.05,
  },
  modalContentDark: {
    backgroundColor: '#0F172A',
    borderRadius: 30,
    padding: 25,
    width: '100%',
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalHeaderDark: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitleDark: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
  },
  careerOptionDark: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  careerOptionTextDark: {
    fontSize: 16,
    color: '#CBD5E1',
    flex: 1,
    paddingRight: 10,
  },
  headerCentered: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greetingLight: {
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  screenTitleLight: {
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: -0.5,
    marginTop: 2,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  avatarPlaceholderDark: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    padding: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  progressCardGlass: {
    borderRadius: 24,
    padding: width * 0.06,
    marginBottom: 30,
    borderWidth: 1,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  progressTitleLight: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '900',
  },
  progressDetailDark: {
    fontSize: 14,
    marginTop: 4,
    fontWeight: '600',
  },
  percentageCircleDark: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  progressPercentageLight: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '900',
  },
  progressBarBgDark: {
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 4,
  },
  progressBarFillLight: {
    height: '100%',
    borderRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  yearSectionGlass: {
    marginBottom: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    borderRadius: 24,
    padding: width * 0.05,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  yearHeaderDark: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    paddingBottom: 10,
  },
  yearTitleLight: {
    fontSize: 18,
    fontWeight: '900',
    color: '#E2E8F0',
  },
  subjectRowDark: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  subjectRowCompletedDark: {
    opacity: 0.4,
  },
  subjectRowLockedDark: {
    opacity: 0.6,
  },
  subjectInfo: {
    flex: 1,
    paddingRight: 10,
  },
  subjectCodeDark: {
    fontSize: 12,
    fontWeight: '900',
    color: '#94A3B8',
    marginBottom: 4,
  },
  subjectTextLight: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  subjectTextCompletedDark: {
    textDecorationLine: 'line-through',
    color: '#64748B',
  },
  checkboxDark: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  gridContainer: {
    flexDirection: 'row',
    marginTop: 10,
    paddingBottom: 20,
  },
  timeColumn: {
    width: 45,
    marginRight: 5,
  },
  emptyCorner: {
    height: 40,
    marginBottom: 10,
  },
  timeLabelContainer: {
    height: 60,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  timeLabelText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    marginTop: -8,
  },
  dayColumn: {
    width: 105,
    marginRight: 5,
  },
  dayColHeader: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  dayColHeaderText: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  dayColBody: {
    position: 'relative',
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
  },
  gridLine: {
    height: 60,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  eventBlock: {
    position: 'absolute',
    left: 2,
    right: 2,
    borderRadius: 8,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
  eventBlockCode: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    fontWeight: '900',
    marginBottom: 2,
  },
  eventBlockTitle: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 14,
  },
  hintText: {
    color: '#64748B',
    textAlign: 'center',
    marginTop: 15,
    fontSize: 12,
    fontStyle: 'italic',
  },
  fabBtnDark: {
    position: 'absolute',
    bottom: height * 0.04,
    right: width * 0.06,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 8,
  },
  modalSheetDark: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: width * 0.06,
    borderWidth: 1,
    borderColor: '#334155',
    width: '100%',
  },
  sheetHandleDark: {
    width: 40,
    height: 5,
    backgroundColor: '#334155',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetTitleLight: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFF',
    marginBottom: 15,
  },
  sheetLabelDark: {
    fontSize: 14,
    fontWeight: '800',
    color: '#94A3B8',
    marginBottom: 12,
    marginTop: 5,
  },
  sheetInputGroup: {
    marginBottom: 20,
  },
  sheetInputDark: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: '#FFF',
    fontWeight: '500',
  },
  sheetSaveBtnDark: {
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginTop: 10,
  },
  sheetSaveText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  sheetCancelBtn: {
    padding: 15,
    alignItems: 'center',
    marginTop: 5,
    marginBottom: Platform.OS === 'ios' ? 20 : 0,
  },
  sheetCancelText: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: 'bold',
  },
  subjectChip: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#334155',
    justifyContent: 'center',
  },
  subjectChipText: {
    color: '#CBD5E1',
    fontSize: 14,
    fontWeight: '600',
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  dayQuickBtn: {
    flex: 1,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    paddingVertical: 14,
    borderRadius: 14,
    marginHorizontal: 3,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  dayQuickBtnText: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '700',
  },
  eventToggleRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderRadius: 16,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  eventToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  eventToggleText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: 'bold',
  },
  mercadoTabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    borderRadius: 16,
    padding: 5,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 15,
  },
  mercadoTabBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  mercadoTabText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
    marginRight: 10,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
  },
  filterChipText: {
    color: '#94A3B8',
    fontWeight: 'bold',
  },
  storeCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderRadius: 20,
    padding: width * 0.05,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#334155',
  },
  storeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  storeIconBox: {
    width: 50,
    height: 50,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  storeCardTextContainer: {
    flex: 1,
  },
  storeCardTitle: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: 'bold',
  },
  storeCardSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },
  storeCardDesc: {
    color: '#CBD5E1',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 20,
  },
  storeCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    paddingTop: 15,
  },
  storePrice: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '900',
  },
  storeBuyBtn: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  storeBuyBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  emptyDriveBox: {
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    padding: width * 0.08,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderStyle: 'dashed',
    marginTop: 20,
  },
  emptyDriveTitle: {
    color: '#E2E8F0',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 10,
  },
  emptyDriveText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 22,
  },
  driveHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    padding: 15,
    borderRadius: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#334155',
  },
  driveBackBtn: {
    paddingRight: 15,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.1)',
    marginRight: 15,
  },
  driveHeaderText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: 'bold',
    flex: 1,
  },
  driveBody: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
    overflow: 'hidden',
  },
  driveItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  driveItemIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  driveItemText: {
    flex: 1,
    color: '#E2E8F0',
    fontSize: 15,
    fontWeight: '600',
    paddingRight: 10,
  },
  bottomNavDark: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    paddingVertical: 10,
    paddingBottom: Platform.OS === 'ios' ? 25 : 15,
    borderTopWidth: 1,
    borderColor: '#334155',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
  },
  navItem: {
    alignItems: 'center',
    flex: 1,
  },
  navCenterBtnDark: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: -5,
    borderWidth: 1,
    borderColor: '#334155',
  },
  navTextDark: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 4,
  },
});