import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TouchableOpacity, 
  SafeAreaView, StatusBar, TextInput, Modal, KeyboardAvoidingView, Platform,
  Animated, Dimensions, ActivityIndicator, Easing, Alert, Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// === IMPORTACIONES DE FIREBASE ===
import { auth, db } from './firebaseConfig'; 
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, getDocs } from 'firebase/firestore';

const { width, height } = Dimensions.get('window');

// ==========================================
// 1. CONSTANTES GLOBALES
// ==========================================
const SPACE_CAREERS = ["Lic. en Física", "Lic. en Matemática", "Lic. en Física Médica"];

const CARRERAS = [
  "Lic. en Física", "Lic. en Matemática", "Lic. en Física Médica",
  "Lic. en Bioquímica", "Farmacia", "Lic. en Biotecnología",
  "Lic. en Química", "Óptica Ocular y Optometría", "Tec. Univ. en Química",
  "Lic. en Cs. de Alimentos", "Tec. Univ. en Alimentos", "Química y Tec. Ambiental"
];

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
const MIN_HORA = 8;  
const MAX_HORA = 22; 
const HORAS = Array.from({ length: MAX_HORA - MIN_HORA + 1 }, (_, i) => i + MIN_HORA);

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidPassword = (password) => {
  return password.length >= 6 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password);
};

// ==========================================
// 2. COMPONENTES ANIMADOS
// ==========================================
const TwinklingStar = ({ size, top, left, delay }) => {
  const opacity = useRef(new Animated.Value(0.1)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(opacity, { toValue: Math.random() * 0.6 + 0.4, duration: 1500 + Math.random() * 2000, delay, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0.1, duration: 1500 + Math.random() * 2000, useNativeDriver: true })
    ])).start();
  }, []);
  return <Animated.View style={{ position: 'absolute', width: size, height: size, borderRadius: size/2, backgroundColor: '#FFF', top, left, opacity }} />;
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
        Animated.timing(translateX, { toValue: -200, duration: 1500, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: height / 1.5, duration: 1500, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 1500, delay: 1000, useNativeDriver: true })
      ]).start(() => setTimeout(shoot, Math.random() * 8000 + 5000));
    };
    setTimeout(shoot, 2000);
  }, []);
  return <Animated.View style={[styles.shootingStar, { transform: [{ translateX }, { translateY }, { rotate: '-45deg' }], opacity }]} />;
};

const AbstractEclipse = () => {
  const translateY = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(translateY, { toValue: -15, duration: 5000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 5000, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
    ])).start();
  }, []);

  return (
    <Animated.View style={{ position: 'absolute', top: '10%', right: -40, transform: [{ translateY }], opacity: 0.8 }}>
      <View style={{ width: 140, height: 140, borderRadius: 70, backgroundColor: '#E0E7FF', shadowColor: '#818CF8', shadowOpacity: 0.8, shadowRadius: 30 }} />
      <View style={{ width: 130, height: 130, borderRadius: 65, backgroundColor: '#050519', position: 'absolute', top: 5, right: 25 }} />
    </Animated.View>
  );
};

const GalaxyBackground = () => {
  const stars = useMemo(() => Array.from({ length: 40 }).map((_, i) => ({ id: i, size: Math.random() * 3 + 1, top: Math.random() * height, left: Math.random() * width, delay: Math.random() * 3000 })), []);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([ Animated.timing(pulseAnim, { toValue: 1.15, duration: 5000, useNativeDriver: true }), Animated.timing(pulseAnim, { toValue: 1, duration: 5000, useNativeDriver: true }) ])).start();
  }, []);

  return (
    <View style={StyleSheet.absoluteFillObject}>
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#050519' }]} />
      <Animated.View style={[styles.nebula, { top: -50, right: -50, backgroundColor: '#4F46E5', transform: [{ scale: pulseAnim }] }]} />
      <Animated.View style={[styles.nebula, { bottom: height/4, left: -100, backgroundColor: '#8B5CF6', width: 350, height: 350, transform: [{ scale: pulseAnim }] }]} />
      {stars.map(star => <TwinklingStar key={star.id} size={star.size} top={star.top} left={star.left} delay={star.delay} />)}
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
        Animated.timing(translateY, { toValue: -100, duration: duration, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: duration, easing: Easing.in(Easing.ease), useNativeDriver: true })
      ]).start(() => float());
    };
    setTimeout(float, delay);
  }, []);

  return <Animated.View style={{ position: 'absolute', width: size, height: size, borderRadius: size/2, borderWidth: 1, borderColor: '#34D399', backgroundColor: 'rgba(52, 211, 153, 0.1)', left, transform: [{ translateY }], opacity }} />;
};

const ChemistryBackground = () => {
  const bubbles = useMemo(() => Array.from({ length: 30 }).map((_, i) => ({ id: i, size: Math.random() * 20 + 10, left: Math.random() * width, delay: Math.random() * 5000, duration: Math.random() * 6000 + 4000 })), []);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([ Animated.timing(pulseAnim, { toValue: 1.1, duration: 4000, useNativeDriver: true }), Animated.timing(pulseAnim, { toValue: 1, duration: 4000, useNativeDriver: true }) ])).start();
  }, []);

  return (
    <View style={StyleSheet.absoluteFillObject}>
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#022C22' }]} /> 
      <Animated.View style={[styles.nebula, { top: -50, right: -50, backgroundColor: '#059669', transform: [{ scale: pulseAnim }] }]} />
      <Animated.View style={[styles.nebula, { bottom: height/4, left: -100, backgroundColor: '#0D9488', width: 350, height: 350, transform: [{ scale: pulseAnim }] }]} />
      {bubbles.map(b => <FloatingBubble key={b.id} size={b.size} left={b.left} delay={b.delay} duration={b.duration} />)}
      
      <View style={{ position: 'absolute', top: '15%', right: 20, opacity: 0.15, transform: [{ rotate: '15deg' }] }}>
        <Ionicons name="flask" size={150} color="#34D399" />
      </View>
      <View style={{ position: 'absolute', bottom: '10%', left: -20, opacity: 0.1, transform: [{ rotate: '-20deg' }] }}>
        <Ionicons name="beaker" size={180} color="#2DD4BF" />
      </View>
    </View>
  );
};

// ==========================================
// 3. COMPONENTE PRINCIPAL (APP)
// ==========================================
export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userCareer, setUserCareer] = useState('');
  const [careerModalVisible, setCareerModalVisible] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [customAlert, setCustomAlert] = useState({ visible: false, title: '', message: '', buttons: null });

  const [activeTab, setActiveTab] = useState('Plan'); 
  const [plan, setPlan] = useState([]);
  
  const [horarios, setHorarios] = useState([]);
  const [scheduleModalVisible, setScheduleModalVisible] = useState(false);
  const [selectedDayTab, setSelectedDayTab] = useState('Lunes');
  const [newSubject, setNewSubject] = useState(null); 
  const [newDay, setNewDay] = useState('Lunes');
  const [newStartTime, setNewStartTime] = useState('8'); 
  const [newEndTime, setNewEndTime] = useState('10');    

  const [mercadoSubTab, setMercadoSubTab] = useState('tienda'); 
  const [storeFilter, setStoreFilter] = useState('ALL'); 
  const [misApuntes, setMisApuntes] = useState([]); 
  const [drivePath, setDrivePath] = useState([]);

  const [tiendaData, setTiendaData] = useState([]);
  const [isStoreLoading, setIsStoreLoading] = useState(true);

  // El tema cambia según la carrera que esté en el estado (que ahora vendrá de la base de datos)
  const isSpaceTheme = !userCareer || SPACE_CAREERS.includes(userCareer);
  const theme = {
    primary: isSpaceTheme ? '#818CF8' : '#34D399', 
    secondary: isSpaceTheme ? '#6366F1' : '#059669',
    bgLight: isSpaceTheme ? 'rgba(129, 140, 248, 0.2)' : 'rgba(52, 211, 153, 0.2)',
    iconHeader: isSpaceTheme ? 'planet' : 'flask',
    actionText: isSpaceTheme ? 'Iniciar Viaje' : 'Iniciar Experimento',
    actionIcon: isSpaceTheme ? 'rocket' : 'flask',
    Background: isSpaceTheme ? GalaxyBackground : ChemistryBackground
  };

  const showAlert = (title, message, buttons = null) => {
    setCustomAlert({ visible: true, title, message, buttons });
  };

  const calcularPesoDeOrden = (titulo) => {
    const t = titulo.toLowerCase();
    if (t.includes('ingreso') || t.includes('matemática preuniversitaria')) return 10;
    if (t.includes('álgebra') || t.includes('algebra')) return 20;
    if (t.includes('análisis 1') || t.includes('analisis 1') || t.includes('análisis matemático i')) return 30;
    if (t.includes('química general') || t.includes('bases químicas')) return 40;
    if (t.includes('física elemental')) return 50;
    if (t.includes('análisis 2') || t.includes('analisis 2')) return 60;
    if (t.includes('física general')) return 70;
    if (t.includes('biología')) return 80;
    if (t.includes('avanzad')) return 900;
    if (t.includes('optativa')) return 1000;
    return 100; 
  };

  useEffect(() => {
    const fetchTienda = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "tienda_apuntes"));
        let packsDisponibles = [];

        querySnapshot.docs.forEach(doc => {
          const rootData = doc.data();
          const category = rootData.category || 'General'; 
          const carpetasRaiz = rootData.driveTree?.children || [];

          carpetasRaiz.forEach((carpetaPack, index) => {
            if (carpetaPack.type === 'folder') {
              const subMaterias = carpetaPack.children
                .filter(c => c.type === 'folder')
                .map(c => c.name)
                .join(' + ');

              packsDisponibles.push({
                id: `${doc.id}_pack_${index}`, 
                title: carpetaPack.name,       
                category: category,
                price: 1500,                   
                icon: category === 'FHOM' ? 'calculator' : 'flask',
                subjects: subMaterias.length > 0 ? subMaterias : 'Material de estudio y resúmenes',
                driveTree: carpetaPack         
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
      } catch (error) {
        console.error("Error al cargar la tienda:", error);
      } finally {
        setIsStoreLoading(false);
      }
    };
    
    if (isAuthenticated) {
      fetchTienda();
    }
  }, [isAuthenticated]);

  // --- LÓGICA DE INICIO DE SESIÓN ACTUALIZADA ---
  const handleLogin = async () => {
    if (email.trim() === '' || password === '') {
      showAlert("Faltan datos", "Por favor, ingresa tu correo y contraseña.");
      return;
    }
    // Ya no pedimos la carrera aquí.

    setIsLoading(true); 
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const userDoc = await getDoc(doc(db, "usuarios", userCredential.user.uid));
      
      let savedCompletedIds = [];
      let savedHorarios = [];
      let savedApuntes = [];
      let carreraGuardada = ''; // Buscaremos la carrera en la BD

      if (userDoc.exists()) {
        const data = userDoc.data();
        savedCompletedIds = data.completedSubjects || [];
        savedHorarios = data.horarios || [];
        savedApuntes = data.misApuntes || [];
        carreraGuardada = data.career || ''; // Obtenemos la carrera!
      }

      if (!carreraGuardada) {
         showAlert("Error", "Tu cuenta no tiene una carrera asignada. Por favor contacta soporte o regístrate nuevamente.");
         await signOut(auth);
         setIsLoading(false);
         return;
      }

      // Seteamos la carrera para que la UI cambie de color automáticamente
      setUserCareer(carreraGuardada);
     
      const planDoc = await getDoc(doc(db, "planes_estudio", carreraGuardada));
      
      if (!planDoc.exists()) {
        showAlert("Error de Backend", `El plan de estudios para "${carreraGuardada}" aún no está cargado en la base de datos.`);
        await signOut(auth);
        setIsLoading(false);
        return;
      }

      const materiasDelBack = planDoc.data().materias || planDoc.data().planes_estudio || [];

      const basePlan = materiasDelBack.map(subj => ({
        ...subj,
        completed: savedCompletedIds.includes(subj.id)
      }));

      setPlan(basePlan);
      setHorarios(savedHorarios);
      setMisApuntes(savedApuntes);
      setIsAuthenticated(true);
      
    } catch (error) {
      if (error.name === 'ReferenceError') {
        showAlert("Error de Código", error.message);
      } else if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        showAlert("Acceso denegado", "El correo o la contraseña son incorrectos.");
      } else if (error.code === 'auth/invalid-email') {
        showAlert("Correo inválido", "El formato del correo no es correcto.");
      } else {
        showAlert("Error de servidor", error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // --- LÓGICA DE REGISTRO ACTUALIZADA ---
  const handleRegister = async () => {
    const trimmedEmail = email.trim();

    if (trimmedEmail === '' || password === '') {
      showAlert("Faltan Datos", "Debes completar tu correo y contraseña para registrarte.");
      return;
    }
    // AQUÍ SÍ EXIGIMOS QUE ELIJA CARRERA
    if (userCareer === '') {
      showAlert("Falta Carrera", "Selecciona a qué carrera te vas a inscribir.");
      return;
    }
    if (!isValidEmail(trimmedEmail)) {
      showAlert("Correo inválido", "Asegúrate de que tu correo tenga un formato válido.");
      return;
    }
    if (!isValidPassword(password)) {
      showAlert("Contraseña débil", "La contraseña debe tener al menos:\n\n• 6 caracteres\n• 1 letra mayúscula\n• 1 letra minúscula\n• 1 número");
      return;
    }
    
    setIsLoading(true); 
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
      
      // Guardamos la carrera seleccionada permanentemente en su perfil
      await setDoc(doc(db, "usuarios", userCredential.user.uid), {
        email: trimmedEmail,
        career: userCareer, // <-- ESTA ES LA CLAVE MÁGICA
        fechaRegistro: new Date(),
        completedSubjects: [],
        horarios: [],
        misApuntes: [] 
      });

      showAlert("¡Registro Exitoso!", "Tu cuenta ha sido creada y vinculada a tu carrera correctamente. Ahora inicia sesión.",
        [{ text: "Entendido", onPress: () => {
            setCustomAlert({ visible: false, title: '', message: '', buttons: null });
            setAuthMode('login');
            setPassword(''); 
            setUserCareer(''); // Limpiamos para que inicie sesión en limpio
        }}]
      );
      
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        showAlert("El correo ya existe", "Esta dirección de correo ya está registrada. Por favor, intenta iniciar sesión.");
      } else {
        showAlert("Error al registrar", error.message);
      }
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
      setPassword('');
      setTiendaData([]); 
      setUserCareer(''); // Limpiamos la carrera al salir para que vuelva el fondo negro default
    } catch (error) {
      showAlert("Error", "No se pudo cerrar sesión correctamente.");
    }
  };

  const isSubjectUnlocked = (subject) => {
    if (!subject.dependencies || subject.dependencies.length === 0) return true;
    return subject.dependencies.every(depId => {
      const dep = plan.find(s => s.id === depId);
      return dep && dep.completed;
    });
  };

  const availableSubjects = useMemo(() => {
    if (!plan) return [];
    return plan.filter(s => !s.completed && isSubjectUnlocked(s));
  }, [plan]);

  const handleSubjectPress = async (subject) => {
    if (isSubjectUnlocked(subject)) {
      const newPlan = plan.map(subj => subj.id === subject.id ? { ...subj, completed: !subj.completed } : subj);
      setPlan(newPlan);

      if (auth.currentUser) {
        const completedIds = newPlan.filter(s => s.completed).map(s => s.id);
        try {
            await setDoc(doc(db, "usuarios", auth.currentUser.uid), { completedSubjects: completedIds }, { merge: true }); 
        } catch(error) {
            console.error("Error guardando progreso:", error);
        }
      }
    } else {
      const missingDeps = subject.dependencies.filter(depId => {
          const dep = plan.find(s => s.id === depId); return !dep || !dep.completed;
        }).map(depId => {
          const d = plan.find(s => s.id === depId); return d ? d.title : depId;
        }).join(', ');
      showAlert("Materia Bloqueada 🔒", `Para cursar "${subject.title}" debes aprobar:\n\n• ${missingDeps}`);
    }
  };

  const progressPercentage = useMemo(() => {
    if (plan.length === 0) return 0;
    return Math.round((plan.filter(s => s.completed).length / plan.length) * 100);
  }, [plan]);

  const planByYear = useMemo(() => {
    const grouped = {};
    plan.forEach(subj => {
      if (!grouped[subj.year]) grouped[subj.year] = [];
      grouped[subj.year].push(subj);
    });
    return grouped;
  }, [plan]);

  const addToSchedule = async () => {
    const start = parseInt(newStartTime);
    const end = parseInt(newEndTime);

    if (newSubject && newDay && start && end && start < end && start >= MIN_HORA && end <= MAX_HORA + 1) {
      const newHorario = { 
        id: Math.random().toString(), subject: newSubject.title, code: newSubject.id,
        day: newDay, start: start, end: end, color: theme.primary 
      };

      const updatedHorarios = [...horarios, newHorario];
      setHorarios(updatedHorarios);
      setScheduleModalVisible(false);
      setNewSubject(null);
      setNewStartTime('8');
      setNewEndTime('10');
      setSelectedDayTab(newDay);

      if (auth.currentUser) {
        try {
            await setDoc(doc(db, "usuarios", auth.currentUser.uid), { horarios: updatedHorarios }, { merge: true }); 
        } catch(error) {
            console.error("Error guardando horario:", error);
        }
      }
    } else {
      showAlert("Datos incompletos", "Por favor, selecciona una materia, un día y un horario válido (ej: 8 a 10).");
    }
  };

  const removeScheduleItem = async (id) => {
    const updatedHorarios = horarios.filter(item => item.id !== id);
    setHorarios(updatedHorarios);

    if (auth.currentUser) {
        try {
            await setDoc(doc(db, "usuarios", auth.currentUser.uid), { horarios: updatedHorarios }, { merge: true });
        } catch(error) {
            console.error("Error borrando horario:", error);
        }
    }
  };

  const simularCompra = (pack) => {
    showAlert("Confirmar Compra", `¿Deseas adquirir el "${pack.title}" por $${pack.price}?`, [
      { text: "Cancelar", style: "cancel", onPress: () => setCustomAlert({ visible: false, title: '', message: '', buttons: null }) },
      { text: "Simular Pago", onPress: async () => {
          setCustomAlert({ visible: false, title: '', message: '', buttons: null });
          const nuevosApuntes = [...misApuntes, pack.id];
          setMisApuntes(nuevosApuntes);
          
          if (auth.currentUser) {
            try {
                await setDoc(doc(db, "usuarios", auth.currentUser.uid), { misApuntes: nuevosApuntes }, { merge: true }); 
                setTimeout(() => {
                  showAlert("¡Compra Exitosa!", `El ${pack.title} ya está en tu biblioteca.`);
                  setMercadoSubTab('mis_apuntes');
                }, 500);
            } catch(error) { console.error("Error guardando apunte:", error); }
          }
      }}
    ]);
  };

  const DynamicBackground = theme.Background;

  if (!isAuthenticated) {
    return (
      <View style={{ flex: 1 }}>
        <StatusBar barStyle="light-content" backgroundColor={isSpaceTheme ? '#050519' : '#022C22'} />
        <DynamicBackground />
        <SafeAreaView style={{ flex: 1 }}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'space-between', paddingHorizontal: 30, paddingVertical: Platform.OS === 'android' ? 60 : 40 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={[styles.logoContainer, { marginTop: 20 }]}>
                <Ionicons name={theme.iconHeader} size={65} color={theme.primary} style={{marginBottom: 10}} />
                <Text style={[styles.authTitleLine1, { textShadowColor: theme.bgLight }]}>UNIVERSO</Text>
                <Text style={[styles.authTitleLine2, { textShadowColor: theme.bgLight }]}>EXACTAS</Text>
                <Text style={[styles.authSubtitle, { color: theme.primary }]}>La facultad en tu bolsillo.</Text>
              </View>

              <View style={[styles.glassCard, { borderColor: theme.bgLight, marginBottom: 20 }]}>
                <Text style={styles.authModeTitle}>{authMode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta Nueva'}</Text>
                
                <View style={styles.unifiedInputContainer}>
                  <Ionicons name="mail" size={20} color={theme.primary} style={styles.inputIcon} />
                  <TextInput style={styles.unifiedInput} placeholder="alumno@exactas.unlp.edu.ar" placeholderTextColor="#64748B" value={email} onChangeText={setEmail} autoCapitalize="none"/>
                </View>
                
                <View style={styles.unifiedInputContainer}>
                  <Ionicons name="lock-closed" size={20} color={theme.primary} style={styles.inputIcon} />
                  <TextInput style={styles.unifiedInput} placeholder="Contraseña" placeholderTextColor="#64748B" secureTextEntry value={password} onChangeText={setPassword}/>
                </View>

                {/* EL SELECTOR DE CARRERA AHORA SOLO APARECE AL REGISTRARSE */}
                {authMode === 'register' && (
                  <TouchableOpacity style={styles.unifiedInputContainer} onPress={() => setCareerModalVisible(true)}>
                    <View style={{flexDirection: 'row', alignItems: 'center', flex: 1}}>
                      <Ionicons name="school" size={20} color={theme.primary} style={styles.inputIcon} />
                      <Text style={[styles.selectorTextDark, !userCareer && {color: '#64748B'}]} numberOfLines={1}>
                        {userCareer ? userCareer : "Selecciona tu carrera..."}
                      </Text>
                    </View>
                    <Ionicons name="chevron-down" size={20} color="#64748B" />
                  </TouchableOpacity>
                )}

                {authMode === 'login' ? (
                  <>
                    <TouchableOpacity style={[styles.loginButton, { backgroundColor: theme.secondary, shadowColor: theme.primary }]} onPress={handleLogin} activeOpacity={0.8} disabled={isLoading}>
                      {isLoading ? <ActivityIndicator color="#FFF" size="small" /> : (
                        <><Text style={styles.loginButtonText}>Entrar</Text><Ionicons name="log-in-outline" size={20} color="#FFF" /></>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.switchModeBtn} onPress={() => { setAuthMode('register'); setUserCareer(''); setPassword(''); }}>
                      <Text style={styles.switchModeText}>¿No tienes cuenta? <Text style={[styles.switchModeTextBold, {color: theme.primary}]}>Regístrate aquí</Text></Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <TouchableOpacity style={[styles.loginButton, { backgroundColor: theme.primary, shadowColor: theme.primary }]} onPress={handleRegister} activeOpacity={0.8} disabled={isLoading}>
                      {isLoading ? <ActivityIndicator color="#FFF" size="small" /> : (
                        <><Text style={styles.loginButtonText}>Registrarme</Text><Ionicons name="person-add-outline" size={20} color="#FFF" /></>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.switchModeBtn} onPress={() => { setAuthMode('login'); setPassword(''); }}>
                      <Text style={styles.switchModeText}>¿Ya tienes cuenta? <Text style={[styles.switchModeTextBold, {color: theme.primary}]}>Inicia sesión</Text></Text>
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
                    <TouchableOpacity key={index} style={styles.careerOptionDark} onPress={() => { setUserCareer(carrera); setCareerModalVisible(false); }}>
                      <Text style={[styles.careerOptionTextDark, userCareer === carrera && {color: theme.primary, fontWeight: 'bold'}]}>{carrera}</Text>
                      {userCareer === carrera && <Ionicons name={isSpace ? "planet" : "flask"} size={24} color={theme.primary} />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </Modal>

        <Modal visible={customAlert.visible} transparent={true} animationType="fade">
          <View style={styles.modalOverlayDark}>
            <View style={styles.customAlertCard}>
              <View style={[styles.alertIconBubble, { backgroundColor: theme.primary + '20' }]}>
                <Ionicons name="alert-circle" size={36} color={theme.primary} />
              </View>
              <Text style={styles.alertTitle}>{customAlert.title}</Text>
              <Text style={styles.alertMessage}>{customAlert.message}</Text>
              <View style={styles.alertButtonsRow}>
                {customAlert.buttons ? customAlert.buttons.map((btn, index) => (
                  <TouchableOpacity key={index} style={[styles.alertBtn, { backgroundColor: btn.style === 'destructive' ? '#EF4444' : btn.style === 'cancel' ? '#334155' : theme.secondary, marginHorizontal: 5 }]} onPress={() => { if(btn.onPress) btn.onPress(); else setCustomAlert({ visible: false, title: '', message: '', buttons: null }); }}>
                    <Text style={styles.alertBtnText}>{btn.text}</Text>
                  </TouchableOpacity>
                )) : (
                  <TouchableOpacity style={[styles.alertBtn, { backgroundColor: theme.secondary }]} onPress={() => setCustomAlert({ visible: false, title: '', message: '', buttons: null })}>
                    <Text style={styles.alertBtnText}>Entendido</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  const renderPlan = () => (
    <ScrollView style={styles.screenContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.greetingLight, { color: theme.primary }]}>Progreso Académico</Text>
          <Text style={styles.screenTitleLight}>Plan de Estudios</Text>
        </View>
        <TouchableOpacity onPress={() => setLogoutModalVisible(true)} style={[styles.avatarPlaceholderDark, { borderColor: theme.bgLight }]}>
          <Ionicons name="log-out" size={20} color="#FCA5A5" />
        </TouchableOpacity>
      </View>

      <View style={[styles.progressCardGlass, { borderColor: theme.bgLight, backgroundColor: theme.bgLight }]}>
        <View style={styles.progressHeader}>
          <View style={{flex: 1, paddingRight: 10}}>
            <Text style={styles.progressTitleLight}>{userCareer}</Text>
            <Text style={[styles.progressDetailDark, { color: theme.primary }]}>{plan.filter(s => s.completed).length} de {plan.length} aprobadas</Text>
          </View>
          <View style={[styles.percentageCircleDark, { borderColor: theme.primary }]}>
            <Text style={styles.progressPercentageLight}>{progressPercentage}%</Text>
          </View>
        </View>
        <View style={styles.progressBarBgDark}>
          <View style={[styles.progressBarFillLight, { width: `${progressPercentage}%`, backgroundColor: theme.secondary, shadowColor: theme.secondary }]} />
        </View>
      </View>

      <View style={styles.treeContainer}>
        {Object.keys(planByYear).sort().map(yearLabel => (
          <View key={yearLabel} style={styles.yearSectionGlass}>
            <View style={styles.yearHeaderDark}>
              <Text style={styles.yearTitleLight}>{yearLabel === 'Optativas' ? 'Optativas' : `Año ${yearLabel}`}</Text>
              <Ionicons name="school" size={18} color="#64748B" />
            </View>
            {planByYear[yearLabel].map((subject) => {
              const unlocked = isSubjectUnlocked(subject);
              return (
                <TouchableOpacity key={subject.id} style={[styles.subjectRowDark, subject.completed && styles.subjectRowCompletedDark, !unlocked && styles.subjectRowLockedDark]} onPress={() => handleSubjectPress(subject)} activeOpacity={0.7}>
                  <View style={styles.subjectInfo}>
                    <Text style={[styles.subjectCodeDark, subject.completed && {color: '#64748B'}, !unlocked && {color: '#475569'}]}>{subject.id}</Text>
                    <Text style={[styles.subjectTextLight, subject.completed && styles.subjectTextCompletedDark, !unlocked && {color: '#64748B'}]}>{subject.title}</Text>
                  </View>
                  <View style={[styles.checkboxDark, subject.completed && {backgroundColor: theme.secondary, borderColor: theme.secondary}, !unlocked && {borderColor: '#334155', backgroundColor: 'transparent'}]}>
                    {subject.completed && <Ionicons name="checkmark" size={14} color="#FFF" />}
                    {!subject.completed && !unlocked && <Ionicons name="lock-closed" size={12} color="#475569" />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
        <View style={{height: 100}} />
      </View>
    </ScrollView>
  );

  const renderHorarios = () => (
    <View style={[styles.screenContainer, {flex: 1, paddingHorizontal: 0, paddingTop: Platform.OS === 'android' ? 50 : 24}]}>
      <View style={[styles.header, {paddingHorizontal: 24}]}>
        <View>
          <Text style={[styles.greetingLight, { color: theme.primary }]}>Organizador Semanal</Text>
          <Text style={styles.screenTitleLight}>Mis Horarios</Text>
        </View>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 10 }}>
          <View style={styles.gridContainer}>
            <View style={styles.timeColumn}>
              <View style={styles.emptyCorner} />
              {HORAS.map(h => (
                <View key={h} style={styles.timeLabelContainer}><Text style={styles.timeLabelText}>{h}:00</Text></View>
              ))}
            </View>
            {DIAS_SEMANA.map(dia => (
              <View key={dia} style={styles.dayColumn}>
                <View style={styles.dayColHeader}><Text style={styles.dayColHeaderText}>{dia.substring(0, 3)}</Text></View>
                <View style={styles.dayColBody}>
                  {HORAS.map(h => (<View key={h} style={styles.gridLine} />))}
                  {horarios.filter(h => h.day === dia).map(evento => {
                    const topPosition = (evento.start - MIN_HORA) * 60; 
                    const blockHeight = (evento.end - evento.start) * 60;
                    return (
                      <TouchableOpacity key={evento.id} style={[styles.eventBlock, { top: topPosition, height: blockHeight, backgroundColor: evento.color }]} onLongPress={() => {
                          showAlert("Eliminar bloque", `¿Quitar ${evento.subject} del horario?`, [
                              { text: "Cancelar", onPress: () => setCustomAlert({ visible: false, title: '', message: '', buttons: null }) }, 
                              { text: "Eliminar", style: 'destructive', onPress: () => { removeScheduleItem(evento.id); setCustomAlert({ visible: false, title: '', message: '', buttons: null }); } }
                            ]);
                        }}>
                        <Text style={styles.eventBlockCode}>{evento.code}</Text>
                        <Text style={styles.eventBlockTitle} numberOfLines={3}>{evento.subject}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
        <Text style={styles.hintText}>Mantén presionado un bloque para eliminarlo.</Text>
        <View style={{height: 100}} />
      </ScrollView>
      <TouchableOpacity style={[styles.fabBtnDark, { backgroundColor: theme.secondary, shadowColor: theme.primary }]} onPress={() => setScheduleModalVisible(true)}>
        <Ionicons name="add" size={30} color="#FFF" />
      </TouchableOpacity>

      <Modal animationType="slide" transparent={true} visible={scheduleModalVisible}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlayDark}>
          <View style={styles.modalSheetDark}>
            <View style={styles.sheetHandleDark} />
            <Text style={styles.sheetTitleLight}>Vincular Materia</Text>
            <Text style={styles.sheetLabelDark}>Materias disponibles para cursar:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 25, maxHeight: 50}}>
              {availableSubjects.length > 0 ? availableSubjects.map(s => (
                <TouchableOpacity key={s.id} style={[styles.subjectChip, newSubject?.id === s.id && {backgroundColor: theme.primary, borderColor: theme.primary}]} onPress={() => setNewSubject(s)}>
                  <Text style={[styles.subjectChipText, newSubject?.id === s.id && {color: '#FFF', fontWeight: 'bold'}]}>{s.title}</Text>
                </TouchableOpacity>
              )) : (<Text style={{color: '#64748B', alignSelf: 'center', fontStyle: 'italic', marginTop: 10}}>No hay materias desbloqueadas.</Text>)}
            </ScrollView>
            <Text style={styles.sheetLabelDark}>Día de la semana:</Text>
            <View style={styles.daysRow}>
              {DIAS_SEMANA.map(d => (
                <TouchableOpacity key={d} style={[styles.dayQuickBtn, newDay === d && {backgroundColor: theme.primary, borderColor: theme.primary}]} onPress={() => setNewDay(d)}>
                  <Text style={[styles.dayQuickBtnText, newDay === d && {color: '#FFF', fontWeight: 'bold'}]}>{d.substring(0, 3)}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.sheetInputGroup}>
              <Text style={styles.sheetLabelDark}>Rango Horario (Ej: 8 a 12):</Text>
              <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
                <TextInput style={[styles.sheetInputDark, {flex: 1, textAlign: 'center'}]} placeholder="Inicio" placeholderTextColor="#64748B" keyboardType="numeric" value={newStartTime} onChangeText={setNewStartTime} />
                <Text style={{color: '#94A3B8', paddingHorizontal: 15, fontWeight: 'bold'}}>hasta</Text>
                <TextInput style={[styles.sheetInputDark, {flex: 1, textAlign: 'center'}]} placeholder="Fin" placeholderTextColor="#64748B" keyboardType="numeric" value={newEndTime} onChangeText={setNewEndTime} />
              </View>
            </View>
            <TouchableOpacity style={[styles.sheetSaveBtnDark, { backgroundColor: theme.secondary }]} onPress={addToSchedule}>
              <Text style={styles.sheetSaveText}>Agregar al Calendario</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sheetCancelBtn} onPress={() => setScheduleModalVisible(false)}>
              <Text style={styles.sheetCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );

  const renderDriveNode = (node) => {
    if (node.type === 'file') {
      if (node.url) {
        Linking.openURL(node.url).catch(err => showAlert("Error", "No se pudo abrir el enlace del archivo."));
      } else {
        showAlert("Aviso", "Este archivo aún no tiene un enlace vinculado.");
      }
      return;
    }
    setDrivePath([...drivePath, node]);
  };

  const handleBackDrive = () => {
    setDrivePath(drivePath.slice(0, -1));
  };

  const renderMercado = () => {
    if (isStoreLoading) {
      return (
        <View style={[styles.screenContainer, {flex: 1, justifyContent: 'center', alignItems: 'center'}]}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={{color: theme.primary, marginTop: 15, fontWeight: 'bold'}}>Sincronizando con Drive...</Text>
        </View>
      );
    }

    const itemsMostrados = storeFilter === 'ALL' ? tiendaData : tiendaData.filter(item => item.category === storeFilter);

    if (drivePath.length > 0) {
      const currentNode = drivePath[drivePath.length - 1]; 
      
      return (
        <View style={[styles.screenContainer, {flex: 1}]}>
          <View style={styles.header}>
            <View>
              <Text style={[styles.greetingLight, { color: theme.primary }]}>Visor de Archivos</Text>
              <Text style={styles.screenTitleLight} numberOfLines={1}>Explorador</Text>
            </View>
          </View>

          <View style={styles.driveHeader}>
            <TouchableOpacity onPress={handleBackDrive} style={styles.driveBackBtn}>
              <Ionicons name="chevron-back" size={24} color="#FFF" />
            </TouchableOpacity>
            <Ionicons name="folder-open" size={20} color={theme.primary} style={{marginRight: 10}} />
            <Text style={styles.driveHeaderText} numberOfLines={1}>{currentNode.name}</Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.driveBody}>
            {currentNode.children && currentNode.children.map((item, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.driveItemRow}
                onPress={() => renderDriveNode(item)}
              >
                <View style={[styles.driveItemIconBox, { backgroundColor: item.type === 'folder' ? theme.primary + '20' : '#EF444420' }]}>
                  <Ionicons 
                    name={item.type === 'folder' ? "folder" : "document-text"} 
                    size={24} 
                    color={item.type === 'folder' ? theme.primary : '#EF4444'} 
                  />
                </View>
                <Text style={styles.driveItemText} numberOfLines={2}>{item.name}</Text>
                {item.type === 'folder' && <Ionicons name="chevron-forward" size={20} color="#475569" />}
                {item.type === 'file' && <Ionicons name="open-outline" size={20} color="#EF4444" />}
              </TouchableOpacity>
            ))}
            
            {(!currentNode.children || currentNode.children.length === 0) && (
              <View style={styles.emptyDriveBox}>
                <Ionicons name="file-tray" size={40} color="#475569" style={{marginBottom: 10}} />
                <Text style={styles.emptyDriveText}>Esta carpeta está vacía.</Text>
              </View>
            )}
            <View style={{height: 100}} />
          </ScrollView>
        </View>
      );
    }

    return (
      <View style={[styles.screenContainer, {flex: 1}]}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.greetingLight, { color: theme.primary }]}>Tu Biblioteca</Text>
            <Text style={styles.screenTitleLight}>Drive Exactas</Text>
          </View>
        </View>

        <View style={styles.mercadoTabContainer}>
          <TouchableOpacity style={[styles.mercadoTabBtn, mercadoSubTab === 'tienda' && { backgroundColor: theme.primary }]} onPress={() => { setMercadoSubTab('tienda'); setDrivePath([]); }}>
            <Ionicons name="cart" size={18} color={mercadoSubTab === 'tienda' ? "#FFF" : "#64748B"} />
            <Text style={[styles.mercadoTabText, mercadoSubTab === 'tienda' && { color: '#FFF' }]}>Tienda</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.mercadoTabBtn, mercadoSubTab === 'mis_apuntes' && { backgroundColor: theme.primary }]} onPress={() => { setMercadoSubTab('mis_apuntes'); setDrivePath([]); }}>
            <Ionicons name="book" size={18} color={mercadoSubTab === 'mis_apuntes' ? "#FFF" : "#64748B"} />
            <Text style={[styles.mercadoTabText, mercadoSubTab === 'mis_apuntes' && { color: '#FFF' }]}>Mis Apuntes</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1, marginTop: 10 }}>
          
          {mercadoSubTab === 'tienda' && (
            <View>
              <View style={styles.filterRow}>
                {['ALL', 'FHOM', 'CIBEX'].map(f => (
                  <TouchableOpacity key={f} style={[styles.filterChip, storeFilter === f && { borderColor: theme.primary, backgroundColor: theme.primary + '20' }]} onPress={() => setStoreFilter(f)}>
                    <Text style={[styles.filterChipText, storeFilter === f && { color: theme.primary }]}>{f === 'ALL' ? 'Todos' : f}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {itemsMostrados.map(pack => {
                const yaComprado = misApuntes.includes(pack.id);
                return (
                  <View key={pack.id} style={styles.storeCard}>
                    <View style={styles.storeCardHeader}>
                      <View style={[styles.storeIconBox, { backgroundColor: theme.primary + '20' }]}><Ionicons name={pack.icon || 'folder'} size={28} color={theme.primary} /></View>
                      <View style={styles.storeCardTextContainer}>
                        <Text style={styles.storeCardTitle}>{pack.title}</Text>
                        <Text style={styles.storeCardSubtitle}>{pack.category}</Text>
                      </View>
                    </View>
                    <Text style={styles.storeCardDesc}>Incluye: {pack.subjects}</Text>
                    <View style={styles.storeCardFooter}>
                      <Text style={styles.storePrice}>${pack.price}</Text>
                      {yaComprado ? (
                        <View style={[styles.storeBuyBtn, { backgroundColor: '#475569' }]}><Text style={styles.storeBuyBtnText}>Adquirido</Text></View>
                      ) : (
                        <TouchableOpacity style={[styles.storeBuyBtn, { backgroundColor: theme.secondary }]} onPress={() => simularCompra(pack)}>
                          <Text style={styles.storeBuyBtnText}>Adquirir</Text>
                          <Ionicons name="cart-outline" size={16} color="#FFF" style={{marginLeft: 5}}/>
                        </TouchableOpacity>
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
                tiendaData.filter(p => misApuntes.includes(p.id)).map(pack => (
                  <View key={pack.id} style={[styles.storeCard, { borderColor: theme.primary + '50' }]}>
                    <View style={styles.storeCardHeader}>
                      <View style={[styles.storeIconBox, { backgroundColor: theme.secondary + '30' }]}><Ionicons name="folder-open" size={28} color={theme.primary} /></View>
                      <View style={styles.storeCardTextContainer}>
                        <Text style={styles.storeCardTitle}>{pack.title}</Text>
                        <Text style={styles.storeCardSubtitle}>Acceso desbloqueado</Text>
                      </View>
                    </View>
                    <TouchableOpacity 
                      style={[styles.storeBuyBtn, { backgroundColor: theme.primary, width: '100%', justifyContent: 'center', marginTop: 10 }]}
                      onPress={() => renderDriveNode(pack.driveTree)} 
                    >
                      <Text style={styles.storeBuyBtnText}>Abrir Carpeta</Text>
                      <Ionicons name="arrow-forward-outline" size={18} color="#FFF" style={{marginLeft: 8}}/>
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                <View style={styles.emptyDriveBox}>
                  <Ionicons name="folder-open-outline" size={50} color="#475569" style={{marginBottom: 15}}/>
                  <Text style={styles.emptyDriveTitle}>Tu biblioteca está vacía</Text>
                  <Text style={styles.emptyDriveText}>Explora la tienda para adquirir resúmenes y material de estudio de tus materias.</Text>
                  <TouchableOpacity style={[styles.storeBuyBtn, { backgroundColor: theme.secondary, marginTop: 20 }]} onPress={() => setMercadoSubTab('tienda')}>
                    <Text style={styles.storeBuyBtnText}>Ir a la Tienda</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          <View style={{height: 100}} />
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: isSpaceTheme ? '#050519' : '#022C22' }}>
      <StatusBar barStyle="light-content" backgroundColor={isSpaceTheme ? '#050519' : '#022C22'} />
      <DynamicBackground />

      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.content}>
          {activeTab === 'Plan' && renderPlan()}
          {activeTab === 'Horarios' && renderHorarios()}
          {activeTab === 'Mercado' && renderMercado()}
        </View>

        <View style={styles.bottomNavDark}>
          <TouchableOpacity style={styles.navItem} onPress={() => { setActiveTab('Horarios'); setDrivePath([]); }}>
            <Ionicons name={activeTab === 'Horarios' ? "time" : "time-outline"} size={26} color={activeTab === 'Horarios' ? theme.primary : "#64748B"} />
            <Text style={[styles.navTextDark, activeTab === 'Horarios' && { color: theme.primary, fontWeight: '900' }]}>Horarios</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => { setActiveTab('Plan'); setDrivePath([]); }}>
            <View style={[styles.navCenterBtnDark, activeTab === 'Plan' && { backgroundColor: theme.secondary, shadowColor: theme.primary, borderColor: theme.primary, elevation: 6 }]}>
              <Ionicons name="git-network" size={28} color={activeTab === 'Plan' ? "#FFF" : "#94A3B8"} />
            </View>
            <Text style={[styles.navTextDark, activeTab === 'Plan' && { color: theme.primary, fontWeight: '900' }, {marginTop: 5}]}>Plan</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('Mercado')}>
            <Ionicons name={activeTab === 'Mercado' ? "library" : "library-outline"} size={26} color={activeTab === 'Mercado' ? theme.primary : "#64748B"} />
            <Text style={[styles.navTextDark, activeTab === 'Mercado' && { color: theme.primary, fontWeight: '900' }]}>Apuntes</Text>
          </TouchableOpacity>
        </View>

        <Modal visible={customAlert.visible} transparent={true} animationType="fade">
          <View style={styles.modalOverlayDark}>
            <View style={styles.customAlertCard}>
              <View style={[styles.alertIconBubble, { backgroundColor: theme.primary + '20' }]}>
                <Ionicons name="alert-circle" size={36} color={theme.primary} />
              </View>
              <Text style={styles.alertTitle}>{customAlert.title}</Text>
              <Text style={styles.alertMessage}>{customAlert.message}</Text>
              <View style={styles.alertButtonsRow}>
                {customAlert.buttons ? customAlert.buttons.map((btn, index) => (
                  <TouchableOpacity key={index} style={[styles.alertBtn, { backgroundColor: btn.style === 'destructive' ? '#EF4444' : btn.style === 'cancel' ? '#334155' : theme.secondary, marginHorizontal: 5 }]} onPress={() => { if(btn.onPress) btn.onPress(); else setCustomAlert({ visible: false, title: '', message: '', buttons: null }); }}>
                    <Text style={styles.alertBtnText}>{btn.text}</Text>
                  </TouchableOpacity>
                )) : (
                  <TouchableOpacity style={[styles.alertBtn, { backgroundColor: theme.secondary }]} onPress={() => setCustomAlert({ visible: false, title: '', message: '', buttons: null })}>
                    <Text style={styles.alertBtnText}>Entendido</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </Modal>

        <Modal animationType="fade" transparent={true} visible={logoutModalVisible}>
          <View style={styles.modalOverlayDark}>
            <View style={[styles.modalContentDark, { alignItems: 'center', paddingVertical: 40 }]}>
              <Ionicons name="log-out-outline" size={60} color="#FCA5A5" style={{marginBottom: 20}} />
              <Text style={[styles.modalTitleDark, {textAlign: 'center', marginBottom: 10}]}>¿Cerrar Sesión?</Text>
              <Text style={{color: '#94A3B8', fontSize: 16, textAlign: 'center', marginBottom: 30, paddingHorizontal: 10}}>Tendrás que volver a ingresar tus credenciales para acceder a tus materias y horarios.</Text>
              <View style={{flexDirection: 'row', justifyContent: 'space-between', width: '100%'}}>
                <TouchableOpacity style={[styles.sheetCancelBtn, {flex: 1, backgroundColor: 'rgba(30, 41, 59, 0.8)', borderRadius: 16, marginRight: 10}]} onPress={() => setLogoutModalVisible(false)}><Text style={styles.sheetCancelText}>Cancelar</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.sheetSaveBtnDark, {flex: 1, backgroundColor: '#EF4444', marginTop: 0}]} onPress={() => { handleLogout(); setLogoutModalVisible(false); }}><Text style={[styles.sheetSaveText, {fontSize: 16}]}>Sí, salir</Text></TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

// ==========================================
// 4. ESTILOS BASE
// ==========================================
const styles = StyleSheet.create({
  content: { flex: 1 },
  screenContainer: { padding: 24, paddingTop: Platform.OS === 'android' ? 40 : 24 },
  nebula: { position: 'absolute', width: 300, height: 300, borderRadius: 150, opacity: 0.25, filter: 'blur(60px)' },
  shootingStar: { position: 'absolute', width: 100, height: 2, backgroundColor: '#FFF', borderRadius: 2, shadowColor: '#FFF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 10 },
  authContent: { flex: 1, justifyContent: 'center', paddingHorizontal: 30 },
  logoContainer: { alignItems: 'center', marginBottom: 50 },
  authTitleLine1: { fontSize: 40, fontWeight: '300', color: '#FFF', letterSpacing: 8, marginBottom: -10, textShadowOffset: {width: 0, height: 2}, textShadowRadius: 10 },
  authTitleLine2: { fontSize: 50, fontWeight: '900', color: '#FFF', letterSpacing: 2, textShadowOffset: {width: 0, height: 2}, textShadowRadius: 15 },
  authSubtitle: { fontSize: 14, marginTop: 15, fontWeight: '600', letterSpacing: 0.5, textAlign: 'center' },
  authModeTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF', marginBottom: 20, textAlign: 'center' },
  switchModeBtn: { marginTop: 20, alignItems: 'center', paddingVertical: 10 },
  switchModeText: { color: '#94A3B8', fontSize: 14, fontWeight: '600' },
  switchModeTextBold: { fontWeight: '900' },
  glassCard: { backgroundColor: 'rgba(15, 23, 42, 0.65)', padding: 25, borderRadius: 30, borderWidth: 1 },
  unifiedInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(30, 41, 59, 0.9)', borderRadius: 16, paddingHorizontal: 16, paddingVertical: Platform.OS === 'ios' ? 16 : 12, marginBottom: 15, borderWidth: 1, borderColor: '#334155', minHeight: 55 },
  unifiedInput: { flex: 1, color: '#FFF', fontSize: 16, padding: 0 },
  inputIcon: { marginRight: 12 },
  selectorTextDark: { fontSize: 16, color: '#FFF' },
  customAlertCard: { backgroundColor: '#0F172A', borderRadius: 24, padding: 25, width: '90%', alignItems: 'center', borderWidth: 1, borderColor: '#334155', shadowColor: '#000', shadowOffset: {width:0, height: 10}, shadowOpacity: 0.4, shadowRadius: 20, elevation: 10 },
  alertIconBubble: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  alertTitle: { fontSize: 22, fontWeight: '900', color: '#FFF', marginBottom: 10, textAlign: 'center' },
  alertMessage: { fontSize: 15, color: '#94A3B8', textAlign: 'center', lineHeight: 22, marginBottom: 25 },
  alertButtonsRow: { flexDirection: 'row', justifyContent: 'center', width: '100%' },
  alertBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center', marginHorizontal: 5 },
  alertBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  loginButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', borderRadius: 16, padding: 18, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.6, shadowRadius: 12 },
  loginButtonText: { color: '#FFF', fontSize: 18, fontWeight: '900', marginRight: 10, letterSpacing: 1 },
  modalOverlayDark: { flex: 1, backgroundColor: 'rgba(5, 5, 25, 0.85)', justifyContent: 'center', padding: 20 },
  modalContentDark: { backgroundColor: '#0F172A', borderRadius: 30, padding: 25, maxHeight: '80%', borderWidth: 1, borderColor: '#334155' },
  modalHeaderDark: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitleDark: { fontSize: 24, fontWeight: 'bold', color: '#FFF' },
  careerOptionDark: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  careerOptionTextDark: { fontSize: 16, color: '#CBD5E1' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  greetingLight: { fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5 },
  screenTitleLight: { fontSize: 34, fontWeight: '900', color: '#FFF', letterSpacing: -0.5, marginTop: 2, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: {width: 0, height: 2}, textShadowRadius: 4 },
  avatarPlaceholderDark: { backgroundColor: 'rgba(30, 41, 59, 0.8)', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },
  progressCardGlass: { borderRadius: 24, padding: 25, marginBottom: 30, borderWidth: 1 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  progressTitleLight: { color: '#FFF', fontSize: 20, fontWeight: '900' },
  progressDetailDark: { fontSize: 14, marginTop: 4, fontWeight: '600' },
  percentageCircleDark: { backgroundColor: 'rgba(0,0,0,0.3)', width: 65, height: 65, borderRadius: 32.5, justifyContent: 'center', alignItems: 'center', borderWidth: 2 },
  progressPercentageLight: { color: '#FFF', fontSize: 22, fontWeight: '900' },
  progressBarBgDark: { height: 8, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 4 },
  progressBarFillLight: { height: '100%', borderRadius: 4, shadowOffset: {width: 0, height: 0}, shadowOpacity: 0.8, shadowRadius: 10 },
  yearSectionGlass: { marginBottom: 20, backgroundColor: 'rgba(15, 23, 42, 0.65)', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  yearHeaderDark: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)', paddingBottom: 10 },
  yearTitleLight: { fontSize: 18, fontWeight: '900', color: '#E2E8F0' },
  subjectRowDark: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  subjectRowCompletedDark: { opacity: 0.4 },
  subjectRowLockedDark: { opacity: 0.6 },
  subjectCodeDark: { fontSize: 12, fontWeight: '900', color: '#94A3B8', marginBottom: 4 },
  subjectTextLight: { fontSize: 16, fontWeight: '700', color: '#F8FAFC' },
  subjectTextCompletedDark: { textDecorationLine: 'line-through', color: '#64748B' },
  checkboxDark: { width: 26, height: 26, borderRadius: 8, borderWidth: 2, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)' },
  gridContainer: { flexDirection: 'row', marginTop: 10, paddingBottom: 20 },
  timeColumn: { width: 50, marginRight: 5 },
  emptyCorner: { height: 40, marginBottom: 10 },
  timeLabelContainer: { height: 60, justifyContent: 'flex-start', alignItems: 'center' }, 
  timeLabelText: { color: '#64748B', fontSize: 12, fontWeight: '700', marginTop: -8 }, 
  dayColumn: { width: 110, marginRight: 5 },
  dayColHeader: { height: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(15, 23, 42, 0.8)', borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#334155' },
  dayColHeaderText: { color: '#E2E8F0', fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase' },
  dayColBody: { position: 'relative', flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', overflow: 'hidden' },
  gridLine: { height: 60, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  eventBlock: { position: 'absolute', left: 2, right: 2, borderRadius: 8, padding: 6, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.5, shadowRadius: 4, elevation: 4 },
  eventBlockCode: { color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: '900', marginBottom: 2 },
  eventBlockTitle: { color: '#FFF', fontSize: 11, fontWeight: '700', lineHeight: 14 },
  hintText: { color: '#64748B', textAlign: 'center', marginTop: 15, fontSize: 12, fontStyle: 'italic' },
  fabBtnDark: { position: 'absolute', bottom: 30, right: 24, width: 65, height: 65, borderRadius: 32.5, justifyContent: 'center', alignItems: 'center', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 15, elevation: 8 },
  modalSheetDark: { backgroundColor: '#0F172A', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 25, borderWidth: 1, borderColor: '#334155' },
  sheetHandleDark: { width: 40, height: 5, backgroundColor: '#334155', borderRadius: 3, alignSelf: 'center', marginBottom: 20 },
  sheetTitleLight: { fontSize: 24, fontWeight: '900', color: '#FFF', marginBottom: 25 },
  sheetLabelDark: { fontSize: 14, fontWeight: '800', color: '#94A3B8', marginBottom: 12, marginTop: 5 },
  sheetInputGroup: { marginBottom: 20 },
  sheetInputDark: { backgroundColor: 'rgba(30, 41, 59, 0.8)', borderWidth: 1, borderColor: '#334155', borderRadius: 16, padding: 16, fontSize: 16, color: '#FFF', fontWeight: '500' },
  sheetSaveBtnDark: { borderRadius: 16, padding: 18, alignItems: 'center', marginTop: 10 },
  sheetSaveText: { color: '#FFF', fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },
  sheetCancelBtn: { padding: 15, alignItems: 'center', marginTop: 5, marginBottom: Platform.OS === 'ios' ? 20 : 0 },
  sheetCancelText: { color: '#94A3B8', fontSize: 16, fontWeight: 'bold' },
  subjectChip: { backgroundColor: 'rgba(30, 41, 59, 0.8)', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20, marginRight: 10, borderWidth: 1, borderColor: '#334155', justifyContent: 'center' },
  subjectChipText: { color: '#CBD5E1', fontSize: 14, fontWeight: '600' },
  daysRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  dayQuickBtn: { flex: 1, backgroundColor: 'rgba(30, 41, 59, 0.8)', paddingVertical: 14, borderRadius: 14, marginHorizontal: 3, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  dayQuickBtnText: { color: '#CBD5E1', fontSize: 14, fontWeight: '700' },
  
  mercadoTabContainer: { flexDirection: 'row', backgroundColor: 'rgba(15, 23, 42, 0.65)', borderRadius: 16, padding: 5, borderWidth: 1, borderColor: '#334155', marginBottom: 15 },
  mercadoTabBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 12, borderRadius: 12 },
  mercadoTabText: { color: '#94A3B8', fontSize: 15, fontWeight: 'bold', marginLeft: 8 },
  filterRow: { flexDirection: 'row', marginBottom: 15 },
  filterChip: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#334155', marginRight: 10, backgroundColor: 'rgba(30, 41, 59, 0.8)' },
  filterChipText: { color: '#94A3B8', fontWeight: 'bold' },
  storeCard: { backgroundColor: 'rgba(15, 23, 42, 0.8)', borderRadius: 20, padding: 20, marginBottom: 15, borderWidth: 1, borderColor: '#334155' },
  storeCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  storeIconBox: { width: 50, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  storeCardTextContainer: { flex: 1 },
  storeCardTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  storeCardSubtitle: { color: '#94A3B8', fontSize: 13, fontWeight: '800', marginTop: 2 },
  storeCardDesc: { color: '#CBD5E1', fontSize: 14, lineHeight: 22, marginBottom: 20 },
  storeCardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: 15 },
  storePrice: { color: '#FFF', fontSize: 24, fontWeight: '900' },
  storeBuyBtn: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14, alignItems: 'center' },
  storeBuyBtnText: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
  emptyDriveBox: { alignItems: 'center', backgroundColor: 'rgba(15, 23, 42, 0.4)', padding: 40, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', borderStyle: 'dashed', marginTop: 20 },
  emptyDriveTitle: { color: '#E2E8F0', fontSize: 18, fontWeight: '800', marginBottom: 10 },
  emptyDriveText: { color: '#64748B', fontSize: 14, fontWeight: '500', textAlign: 'center', lineHeight: 22 },

  driveHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(15, 23, 42, 0.8)', padding: 15, borderRadius: 16, marginBottom: 15, borderWidth: 1, borderColor: '#334155' },
  driveBackBtn: { paddingRight: 15, borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.1)', marginRight: 15 },
  driveHeaderText: { color: '#FFF', fontSize: 18, fontWeight: 'bold', flex: 1 },
  driveBody: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', borderRadius: 20, borderWidth: 1, borderColor: '#334155', overflow: 'hidden' },
  driveItemRow: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  driveItemIconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  driveItemText: { flex: 1, color: '#E2E8F0', fontSize: 16, fontWeight: '600' },

  bottomNavDark: { flexDirection: 'row', backgroundColor: 'rgba(15, 23, 42, 0.95)', paddingVertical: 10, paddingBottom: Platform.OS === 'ios' ? 30 : 15, borderTopWidth: 1, borderColor: '#334155', justifyContent: 'space-around', alignItems: 'flex-end' },
  navCenterBtnDark: { backgroundColor: 'rgba(30, 41, 59, 0.8)', width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: -5, borderWidth: 1, borderColor: '#334155' },
  navTextDark: { color: '#64748B', fontSize: 12, fontWeight: '800', marginTop: 4 },
});