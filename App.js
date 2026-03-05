import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TouchableOpacity, 
  SafeAreaView, StatusBar, TextInput, Modal, KeyboardAvoidingView, Platform,
  Animated, Dimensions, Easing, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from './firebaseConfig'; 
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const { width, height } = Dimensions.get('window');

// ==========================================
// 1. CONSTANTES GLOBALES
// ==========================================
const SPACE_CAREERS = ["Lic. en Física", "Lic. en Matemática", "Lic. en Física Médica"];

// Ahora la lista de carreras está estática porque el contenido viene de la nube
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

// ==========================================
// 2. COMPONENTES ANIMADOS (Fondos Dinámicos)
// ==========================================
const TwinklingStar = ({ size, top, left, delay }) => {
  const opacity = useRef(new Animated.Value(0.1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: Math.random() * 0.6 + 0.4, duration: 1500 + Math.random() * 2000, delay, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.1, duration: 1500 + Math.random() * 2000, useNativeDriver: true })
      ])
    ).start();
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
    Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, { toValue: -15, duration: 5000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 5000, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
      ])
    ).start();
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

  const [activeTab, setActiveTab] = useState('Plan');
  const [plan, setPlan] = useState([]);
  
  const [horarios, setHorarios] = useState([]);
  const [scheduleModalVisible, setScheduleModalVisible] = useState(false);
  const [selectedDayTab, setSelectedDayTab] = useState('Lunes');
  const [newSubject, setNewSubject] = useState(null); 
  const [newDay, setNewDay] = useState('Lunes');
  const [newStartTime, setNewStartTime] = useState('8'); 
  const [newEndTime, setNewEndTime] = useState('10');    

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

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isValidPassword = (password) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{6,}$/;
    return passwordRegex.test(password);
  };

  // --- LOGICA DE FIREBASE ---
  const handleLogin = async () => {
    if (email.trim() === '' || password === '') {
      Alert.alert("Faltan datos", "Por favor, ingresa tu correo y contraseña.");
      return;
    }
    if (userCareer === '') {
        Alert.alert("Falta Carrera", "Selecciona a qué carrera quieres ingresar.");
        return;
    }

    try {
      // 1. Autenticar en Google
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      
      // 2. Traer el plan de la NUBE (¡Adiós código duro!)
      const planRef = await getDoc(doc(db, "planes_estudio", userCareer));
      if (!planRef.exists()) {
        Alert.alert("Error de Servidor", "No se encontró el plan de esta carrera en la base de datos.");
        return;
      }
      const cloudPlan = planRef.data().materias || [];

      // 3. Traer el progreso y horarios del USUARIO
      const userDoc = await getDoc(doc(db, "usuarios", userCredential.user.uid));
      let savedCompletedIds = [];
      let savedHorarios = [];

      if (userDoc.exists()) {
        const data = userDoc.data();
        savedCompletedIds = data.completedSubjects || [];
        savedHorarios = data.horarios || [];
      }

      // 4. Cruzar los datos: Plan en la nube + Progreso del usuario
      const basePlan = cloudPlan.map(subj => ({
        ...subj,
        completed: savedCompletedIds.includes(subj.id)
      }));

      setPlan(basePlan);
      setHorarios(savedHorarios);
      setIsAuthenticated(true);
      
    } catch (error) {
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        Alert.alert("Acceso denegado", "El correo o la contraseña son incorrectos.");
      } else if (error.code === 'auth/invalid-email') {
        Alert.alert("Correo inválido", "El formato del correo no es correcto (ej: nombre@dominio.com).");
      } else {
        Alert.alert("Error", error.message);
      }
    }
  };

  const handleRegister = async () => {
    const trimmedEmail = email.trim();

    if (trimmedEmail === '' || password === '') {
      Alert.alert("Faltan Datos", "Debes completar tu correo y contraseña para registrarte.");
      return;
    }
    if (!isValidEmail(trimmedEmail)) {
        Alert.alert("Correo inválido", "Asegúrate de que tu correo tenga un formato válido (debe incluir '@' y un dominio).");
        return;
    }
    if (!isValidPassword(password)) {
      Alert.alert(
        "Contraseña débil", 
        "La contraseña debe tener al menos:\n\n• 6 caracteres\n• 1 letra mayúscula\n• 1 letra minúscula\n• 1 número\n\n(No se permiten caracteres especiales como @, #, $, etc.)"
      );
      return;
    }
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
      
      await setDoc(doc(db, "usuarios", userCredential.user.uid), {
        email: trimmedEmail,
        fechaRegistro: new Date(),
        completedSubjects: [],
        horarios: []
      });

      Alert.alert(
          "¡Registro Exitoso!", 
          "Tu cuenta ha sido creada correctamente. Ahora selecciona tu carrera e inicia sesión.",
          [{ text: "Entendido", onPress: () => {
              setAuthMode('login');
              setPassword(''); 
          }}]
      );
      
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        Alert.alert("El correo ya existe", "Esta dirección de correo ya está registrada. Por favor, intenta iniciar sesión.");
      } else {
        Alert.alert("Error al registrar", error.message);
      }
    }
  };

  // --- LÓGICA DE CORRELATIVAS ---
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
            await setDoc(doc(db, "usuarios", auth.currentUser.uid), {
                completedSubjects: completedIds
            }, { merge: true }); 
        } catch(error) {
            console.error("Error guardando progreso:", error);
        }
      }

    } else {
      const missingDeps = subject.dependencies
        .filter(depId => {
          const dep = plan.find(s => s.id === depId);
          return !dep || !dep.completed;
        })
        .map(depId => {
          const d = plan.find(s => s.id === depId);
          return d ? d.title : depId;
        })
        .join(', ');

      Alert.alert("Materia Bloqueada 🔒", `Para cursar "${subject.title}" debes aprobar:\n\n• ${missingDeps}`);
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
        id: Math.random().toString(), 
        subject: newSubject.title, 
        code: newSubject.id,
        day: newDay, 
        start: start, 
        end: end, 
        color: theme.primary 
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
            await setDoc(doc(db, "usuarios", auth.currentUser.uid), {
                horarios: updatedHorarios
            }, { merge: true }); 
        } catch(error) {
            console.error("Error guardando horario:", error);
        }
      }

    } else {
      Alert.alert("Datos incompletos", "Por favor, selecciona una materia, un día y un horario válido (ej: 8 a 10).");
    }
  };

  const removeScheduleItem = async (id) => {
    const updatedHorarios = horarios.filter(item => item.id !== id);
    
    setHorarios(updatedHorarios);

    if (auth.currentUser) {
        try {
            await setDoc(doc(db, "usuarios", auth.currentUser.uid), {
                horarios: updatedHorarios
            }, { merge: true });
        } catch(error) {
            console.error("Error borrando horario:", error);
        }
    }
  };

  const DynamicBackground = theme.Background;

  // ==========================================
  // PANTALLAS (VISTAS)
  // ==========================================
  if (!isAuthenticated) {
    return (
      <View style={{ flex: 1 }}>
        <StatusBar barStyle="light-content" backgroundColor={isSpaceTheme ? '#050519' : '#022C22'} />
        <DynamicBackground />

        <SafeAreaView style={{ flex: 1 }}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.authContent}>
            
            <View style={styles.logoContainer}>
              <Ionicons name={theme.iconHeader} size={60} color={theme.primary} style={{marginBottom: 10}} />
              <Text style={[styles.authTitleLine1, { textShadowColor: theme.bgLight }]}>UNIVERSO</Text>
              <Text style={[styles.authTitleLine2, { textShadowColor: theme.bgLight }]}>EXACTAS</Text>
              <Text style={[styles.authSubtitle, { color: theme.primary }]}>La facultad en tu bolsillo.</Text>
            </View>

            <View style={[styles.glassCard, { borderColor: theme.bgLight }]}>
              
              <Text style={styles.authModeTitle}>
                {authMode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta Nueva'}
              </Text>

              <View style={styles.inputContainerDark}>
                <Ionicons name="mail" size={20} color={theme.primary} style={styles.inputIcon} />
                <TextInput style={styles.inputDark} placeholder="alumno@exactas.unlp.edu.ar" placeholderTextColor="#64748B" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address"/>
              </View>

              <View style={styles.inputContainerDark}>
                <Ionicons name="lock-closed" size={20} color={theme.primary} style={styles.inputIcon} />
                <TextInput style={styles.inputDark} placeholder="Contraseña" placeholderTextColor="#64748B" secureTextEntry value={password} onChangeText={setPassword}/>
              </View>

              {authMode === 'login' && (
                <TouchableOpacity style={styles.selectorButtonDark} onPress={() => setCareerModalVisible(true)}>
                  <View style={{flexDirection: 'row', alignItems: 'center', flex: 1}}>
                    <Ionicons name="school" size={20} color={theme.primary} style={styles.inputIcon} />
                    <Text style={[styles.selectorTextDark, !userCareer && {color: '#64748B'}]} numberOfLines={1}>
                      {userCareer ? userCareer : "Selecciona a qué carrera ingresar..."}
                    </Text>
                  </View>
                  <Ionicons name="chevron-down" size={20} color="#64748B" />
                </TouchableOpacity>
              )}

              {authMode === 'login' ? (
                <>
                  <TouchableOpacity style={[styles.loginButton, { backgroundColor: theme.secondary, shadowColor: theme.primary }]} onPress={handleLogin} activeOpacity={0.8}>
                    <Text style={styles.loginButtonText}>Entrar</Text>
                    <Ionicons name="log-in-outline" size={20} color="#FFF" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.switchModeBtn} onPress={() => { setAuthMode('register'); setUserCareer(''); setPassword(''); }}>
                    <Text style={styles.switchModeText}>¿No tienes cuenta? <Text style={[styles.switchModeTextBold, {color: theme.primary}]}>Regístrate aquí</Text></Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity style={[styles.loginButton, { backgroundColor: theme.primary, shadowColor: theme.primary }]} onPress={handleRegister} activeOpacity={0.8}>
                    <Text style={styles.loginButtonText}>Registrarme</Text>
                    <Ionicons name="person-add-outline" size={20} color="#FFF" />
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.switchModeBtn} onPress={() => { setAuthMode('login'); setPassword(''); }}>
                    <Text style={styles.switchModeText}>¿Ya tienes cuenta? <Text style={[styles.switchModeTextBold, {color: theme.primary}]}>Inicia sesión</Text></Text>
                  </TouchableOpacity>
                </>
              )}
            </View>

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
        <TouchableOpacity onPress={() => {
          signOut(auth);
          setIsAuthenticated(false);
          setPassword('');
          setPlan([]); 
          setHorarios([]); 
        }} style={[styles.avatarPlaceholderDark, { borderColor: theme.bgLight }]}>
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
                <TouchableOpacity 
                  key={subject.id} 
                  style={[styles.subjectRowDark, subject.completed && styles.subjectRowCompletedDark, !unlocked && styles.subjectRowLockedDark]}
                  onPress={() => handleSubjectPress(subject)} 
                  activeOpacity={0.7}
                >
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

  const renderHorarios = () => {
    return (
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
                  <View key={h} style={styles.timeLabelContainer}>
                    <Text style={styles.timeLabelText}>{h}:00</Text>
                  </View>
                ))}
              </View>

              {DIAS_SEMANA.map(dia => (
                <View key={dia} style={styles.dayColumn}>
                  <View style={styles.dayColHeader}>
                    <Text style={styles.dayColHeaderText}>{dia.substring(0, 3)}</Text>
                  </View>
                  
                  <View style={styles.dayColBody}>
                    {HORAS.map(h => (
                      <View key={h} style={styles.gridLine} />
                    ))}

                    {horarios.filter(h => h.day === dia).map(evento => {
                      const topPosition = (evento.start - MIN_HORA) * 60; 
                      const blockHeight = (evento.end - evento.start) * 60;

                      return (
                        <TouchableOpacity 
                          key={evento.id} 
                          style={[styles.eventBlock, { top: topPosition, height: blockHeight, backgroundColor: evento.color }]}
                          onLongPress={() => {
                            Alert.alert(
                              "Eliminar bloque",
                              `¿Quitar ${evento.subject} del horario?`,
                              [{ text: "Cancelar", style: "cancel" }, { text: "Eliminar", style: "destructive", onPress: () => removeScheduleItem(evento.id) }]
                            );
                          }}
                        >
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
                  <TouchableOpacity 
                    key={s.id} 
                    style={[styles.subjectChip, newSubject?.id === s.id && {backgroundColor: theme.primary, borderColor: theme.primary}]}
                    onPress={() => setNewSubject(s)}
                  >
                    <Text style={[styles.subjectChipText, newSubject?.id === s.id && {color: '#FFF', fontWeight: 'bold'}]}>{s.title}</Text>
                  </TouchableOpacity>
                )) : (
                  <Text style={{color: '#64748B', alignSelf: 'center', fontStyle: 'italic', marginTop: 10}}>No hay materias desbloqueadas.</Text>
                )}
              </ScrollView>

              <Text style={styles.sheetLabelDark}>Día de la semana:</Text>
              <View style={styles.daysRow}>
                {DIAS_SEMANA.map(d => (
                  <TouchableOpacity 
                    key={d} 
                    style={[styles.dayQuickBtn, newDay === d && {backgroundColor: theme.primary, borderColor: theme.primary}]}
                    onPress={() => setNewDay(d)}
                  >
                    <Text style={[styles.dayQuickBtnText, newDay === d && {color: '#FFF', fontWeight: 'bold'}]}>{d.substring(0, 3)}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.sheetInputGroup}>
                <Text style={styles.sheetLabelDark}>Rango Horario (Ej: 8 a 12):</Text>
                <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
                  <TextInput 
                    style={[styles.sheetInputDark, {flex: 1, textAlign: 'center'}]} 
                    placeholder="Inicio" placeholderTextColor="#64748B" 
                    keyboardType="numeric" value={newStartTime} onChangeText={setNewStartTime} 
                  />
                  <Text style={{color: '#94A3B8', paddingHorizontal: 15, fontWeight: 'bold'}}>hasta</Text>
                  <TextInput 
                    style={[styles.sheetInputDark, {flex: 1, textAlign: 'center'}]} 
                    placeholder="Fin" placeholderTextColor="#64748B" 
                    keyboardType="numeric" value={newEndTime} onChangeText={setNewEndTime} 
                  />
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
  };

  return (
    <View style={{ flex: 1, backgroundColor: isSpaceTheme ? '#050519' : '#022C22' }}>
      <StatusBar barStyle="light-content" backgroundColor={isSpaceTheme ? '#050519' : '#022C22'} />
      <DynamicBackground />

      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.content}>
          {activeTab === 'Plan' && renderPlan()}
          {activeTab === 'Horarios' && renderHorarios()}
        </View>

        <View style={styles.bottomNavDark}>
          <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('Horarios')}>
            <Ionicons name={activeTab === 'Horarios' ? "time" : "time-outline"} size={26} color={activeTab === 'Horarios' ? theme.primary : "#64748B"} />
            <Text style={[styles.navTextDark, activeTab === 'Horarios' && { color: theme.primary, fontWeight: '900' }]}>Horarios</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('Plan')}>
            <View style={[styles.navCenterBtnDark, activeTab === 'Plan' && { backgroundColor: theme.secondary, shadowColor: theme.primary, borderColor: theme.primary, elevation: 6 }]}>
              <Ionicons name="git-network" size={28} color={activeTab === 'Plan' ? "#FFF" : "#94A3B8"} />
            </View>
            <Text style={[styles.navTextDark, activeTab === 'Plan' && { color: theme.primary, fontWeight: '900' }, {marginTop: 5}]}>Plan</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => Alert.alert("Fase 3", "El Mercado Drive estará disponible en la próxima actualización.")}>
            <Ionicons name="library-outline" size={26} color="#64748B" />
            <Text style={styles.navTextDark}>Mercado</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

// ESTILOS
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
  inputIcon: { marginRight: 10 },
  inputDark: { flex: 1, color: '#FFF', paddingVertical: 18, fontSize: 16 },
  selectorButtonDark: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(30, 41, 59, 0.9)', borderRadius: 16, padding: 18, marginBottom: 25, borderWidth: 1, borderColor: '#334155' },
  selectorTextDark: { fontSize: 16, color: '#FFF' },
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
  sectionSubtitleDark: { fontSize: 18, fontWeight: '800', color: '#94A3B8', marginBottom: 15, marginTop: 10 },
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

  bottomNavDark: { flexDirection: 'row', backgroundColor: 'rgba(15, 23, 42, 0.95)', paddingVertical: 10, paddingBottom: Platform.OS === 'ios' ? 30 : 15, borderTopWidth: 1, borderColor: '#334155', justifyContent: 'space-around', alignItems: 'flex-end' },
  navCenterBtnDark: { backgroundColor: 'rgba(30, 41, 59, 0.8)', width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: -5, borderWidth: 1, borderColor: '#334155' },
  navTextDark: { color: '#64748B', fontSize: 12, fontWeight: '800', marginTop: 4 },
});