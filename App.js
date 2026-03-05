import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TouchableOpacity, 
  SafeAreaView, StatusBar, TextInput, Modal, KeyboardAvoidingView, Platform,
  Animated, Dimensions, Easing, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

// ==========================================
// 1. BASE DE DATOS: MATERIAS Y CORRELATIVAS (UNLP EXACTAS)
// ==========================================

const STUDY_PLANS = {
  "Lic. en Física": [
    { id: 'E0201', title: 'Análisis Matemático I', year: 1, completed: false, dependencies: [] },
    { id: 'E0202', title: 'Álgebra', year: 1, completed: false, dependencies: [] },
    { id: 'E0204', title: 'Física General I', year: 1, completed: false, dependencies: [] },
    { id: 'E0205', title: 'Física Experimental I', year: 1, completed: false, dependencies: [] },
    { id: 'E0206', title: 'Física General II', year: 1, completed: false, dependencies: ['E0204', 'E0205'] },
    { id: 'E0207', title: 'Física Experimental II', year: 1, completed: false, dependencies: ['E0204', 'E0205'] },
    { id: 'E0203', title: 'Análisis Matemático II', year: 2, completed: false, dependencies: ['E0201', 'E0202'] },
    { id: 'OPT-ALG', title: 'Álgebra Lineal', year: 2, completed: false, dependencies: ['E0202'] },
    { id: 'E0208', title: 'Física General III', year: 2, completed: false, dependencies: ['E0206', 'E0207'] },
    { id: 'E0209', title: 'Física Experimental III', year: 2, completed: false, dependencies: ['E0206', 'E0207'] },
    { id: 'S0201', title: 'Física General IV', year: 2, completed: false, dependencies: ['E0208', 'E0209'] },
    { id: 'S0202', title: 'Física Experimental IV', year: 2, completed: false, dependencies: ['E0208', 'E0209'] },
    { id: 'S0203', title: 'Matemáticas Especiales I', year: 2, completed: false, dependencies: ['E0203'] },
    { id: 'S0204', title: 'Física Macroscópica', year: 2, completed: false, dependencies: ['E0206'] },
    { id: 'S0205', title: 'Mecánica Analítica', year: 3, completed: false, dependencies: ['E0203', 'E0208', 'E0209'] },
    { id: 'S0206', title: 'Matemáticas Especiales II', year: 3, completed: false, dependencies: ['S0203'] },
    { id: 'S0207', title: 'Electromagnetismo', year: 3, completed: false, dependencies: ['E0208', 'E0209', 'S0203'] },
    { id: 'S0208', title: 'Experimentos Electromagnéticos', year: 3, completed: false, dependencies: ['E0208', 'E0209', 'S0203'] },
    { id: 'S0209', title: 'Mecánica Cuántica I', year: 3, completed: false, dependencies: ['S0207', 'S0208'] },
    { id: 'S0210', title: 'Experimentos Cuánticos I', year: 3, completed: false, dependencies: ['S0207', 'S0208'] },
    { id: 'OPT-3.1', title: 'Materia Optativa 1', year: 3, completed: false, dependencies: [] },
    { id: 'OPT-3.2', title: 'Materia Optativa 2', year: 3, completed: false, dependencies: [] },
    { id: 'OPT-3.3', title: 'Materia Optativa 3', year: 3, completed: false, dependencies: [] },
    { id: 'S0211', title: 'Mecánica Cuántica II', year: 4, completed: false, dependencies: ['S0209', 'S0210'] },
    { id: 'S0212', title: 'Experimentos Cuánticos II', year: 4, completed: false, dependencies: ['S0209', 'S0210'] },
    { id: 'S0213', title: 'Mecánica Estadística', year: 4, completed: false, dependencies: ['S0209', 'S0210'] },
    { id: 'OPT-4.1', title: 'Materia Optativa 4', year: 4, completed: false, dependencies: [] },
    { id: 'OPT-4.2', title: 'Materia Optativa 5', year: 4, completed: false, dependencies: [] },
    { id: 'OPT-4.3', title: 'Materia Optativa 6', year: 4, completed: false, dependencies: [] },
    { id: 'OPT-4.4', title: 'Materia Optativa 7', year: 4, completed: false, dependencies: [] },
    { id: 'S0214', title: 'Trabajo Final de Diploma', year: 5, completed: false, dependencies: ['S0211', 'S0213'] }
  ],
  "Lic. en Matemática": [
    { id: 'E0201', title: 'Análisis Matemático I', year: 1, completed: false, dependencies: [] },
    { id: 'E0202', title: 'Álgebra', year: 1, completed: false, dependencies: [] },
    { id: 'E0203', title: 'Análisis Matemático II', year: 2, completed: false, dependencies: ['E0201', 'E0202'] },
    { id: 'M0201', title: 'Álgebra Lineal', year: 2, completed: false, dependencies: ['E0202'] },
    { id: 'M0202', title: 'Complementos de Análisis', year: 2, completed: false, dependencies: ['E0203'] },
    { id: 'M0203', title: 'Probabilidades', year: 2, completed: false, dependencies: ['E0203'] },
    { id: 'M0204', title: 'Elem. de Matemática Aplicada', year: 2, completed: false, dependencies: ['E0201', 'E0202'] },
    { id: 'M0205', title: 'Estructuras Algebraicas', year: 3, completed: false, dependencies: ['M0201'] },
    { id: 'M0206', title: 'Medida e Integración', year: 3, completed: false, dependencies: ['M0202'] },
    { id: 'M0207', title: 'Geometría Diferencial', year: 3, completed: false, dependencies: ['M0201', 'M0202'] },
    { id: 'M0208', title: 'Funciones Analíticas', year: 3, completed: false, dependencies: ['M0202'] },
    { id: 'M0209', title: 'Topología', year: 4, completed: false, dependencies: ['M0202', 'M0205'] },
    { id: 'M0211', title: 'Análisis Funcional', year: 4, completed: false, dependencies: ['M0201', 'M0206', 'M0208'] },
    { id: 'OPT-4.1', title: 'Materia Optativa 1', year: 4, completed: false, dependencies: [] },
    { id: 'OPT-4.2', title: 'Materia Optativa 2', year: 4, completed: false, dependencies: [] },
    { id: 'M0213', title: 'Ecuaciones Diferenciales', year: 5, completed: false, dependencies: ['M0211'] },
    { id: 'OPT-5.1', title: 'Materia Optativa 3', year: 5, completed: false, dependencies: [] },
    { id: 'OPT-5.2', title: 'Materia Optativa 4', year: 5, completed: false, dependencies: [] },
    { id: 'M0216', title: 'Trabajo Iniciación a Inv.', year: 5, completed: false, dependencies: ['M0213'] }
  ],
  "Lic. en Física Médica": [
    { id: 'E0204', title: 'Física General I', year: 1, completed: false, dependencies: [] },
    { id: 'E0205', title: 'Física Experimental I', year: 1, completed: false, dependencies: [] },
    { id: 'D0101', title: 'Álgebra', year: 1, completed: false, dependencies: [] },
    { id: 'D0102', title: 'Análisis Matemático I', year: 1, completed: false, dependencies: [] },
    { id: 'E0206', title: 'Física General II', year: 1, completed: false, dependencies: ['D0101', 'D0102', 'E0204', 'E0205'] },
    { id: 'E0207', title: 'Física Experimental II', year: 1, completed: false, dependencies: ['D0101', 'D0102', 'E0204', 'E0205'] },
    { id: 'D0103', title: 'Análisis Matemático II', year: 1, completed: false, dependencies: ['D0101', 'D0102'] },
    { id: 'D0201', title: 'Química I', year: 1, completed: false, dependencies: ['D0101', 'D0102'] },
    { id: 'A0208', title: 'Biología', year: 2, completed: false, dependencies: ['D0201'] },
    { id: 'E0208', title: 'Física General III', year: 2, completed: false, dependencies: ['E0206', 'E0207'] },
    { id: 'E0209', title: 'Física Experimental III', year: 2, completed: false, dependencies: ['E0206', 'E0207'] },
    { id: 'D0203', title: 'Electromagnetismo', year: 2, completed: false, dependencies: ['E0208', 'E0209', 'D0103'] },
    { id: 'D0202', title: 'Química II', year: 2, completed: false, dependencies: ['D0201'] },
    { id: 'D0204', title: 'Computación', year: 2, completed: false, dependencies: ['D0103', 'E0208'] },
    { id: 'D0205', title: 'Matemáticas Especiales', year: 2, completed: false, dependencies: ['D0103'] },
    { id: 'D0206', title: 'Química III', year: 2, completed: false, dependencies: ['A0208', 'D0202'] },
    { id: 'U0201', title: 'Anatomía e Histología', year: 3, completed: false, dependencies: ['A0208'] },
    { id: 'D0207', title: 'Física Cuántica', year: 3, completed: false, dependencies: ['D0203'] },
    { id: 'D0208', title: 'Prob. y Estadística', year: 3, completed: false, dependencies: ['D0204'] },
    { id: 'D0209', title: 'Electrónica', year: 3, completed: false, dependencies: ['D0205', 'E0208'] },
    { id: 'U0203', title: 'Fisiología', year: 3, completed: false, dependencies: ['U0201'] },
    { id: 'D0212', title: 'El Núcleo y Radiaciones', year: 3, completed: false, dependencies: ['D0207'] },
    { id: 'D0210', title: 'Física Estadística', year: 3, completed: false, dependencies: ['D0203', 'D0205', 'D0208'] },
    { id: 'D0213', title: 'Analísis de Señales', year: 3, completed: false, dependencies: ['D0205', 'D0208'] },
    { id: 'D0215', title: 'Física de la Salud', year: 4, completed: false, dependencies: ['D0212'] },
    { id: 'D0214', title: 'Biofísica', year: 4, completed: false, dependencies: ['D0206', 'D0210', 'U0203'] },
    { id: 'D0217', title: 'Física de la Radioterapia', year: 4, completed: false, dependencies: ['D0212'] },
    { id: 'D0216', title: 'Radiobiología y Dosimetría', year: 4, completed: false, dependencies: ['U0203', 'D0212'] },
    { id: 'D0218', title: 'Laboratorio en Física de la Radiación', year: 4, completed: false, dependencies: ['D0212'] },
    { id: 'D0221', title: 'Fundamentos del Laser', year: 4, completed: false, dependencies: ['D0207', 'D0210'] },
    { id: 'D0220', title: 'Física de la Med. Nuclear', year: 4, completed: false, dependencies: ['D0215', 'D0216'] },
    { id: 'D0219', title: 'Técnicas del Radioanálisis', year: 4, completed: false, dependencies: ['D0206', 'D0212'] },
    { id: 'D0222', title: 'Física Imágenes Médicas', year: 4, completed: false, dependencies: ['D0213', 'U0203'] },
    { id: 'D0225', title: 'Lab. en Medicina Nuclear', year: 4, completed: false, dependencies: ['D0215', 'D0216'] },
    { id: 'D0226', title: 'Lab. en Imágenes Médicas', year: 4, completed: false, dependencies: ['U0203', 'D0213'] },
    { id: 'OPT-5.1', title: 'Materia Optativa 1', year: 5, completed: false, dependencies: [] },
    { id: 'OPT-5.2', title: 'Materia Optativa 2', year: 5, completed: false, dependencies: [] },
    { id: 'D0224', title: 'Trabajo de Diploma', year: 5, completed: false, dependencies: ['D0214', 'D0215', 'D0216', 'D0217', 'D0218', 'D0219', 'D0220', 'D0221', 'D0222'] }
  ],
  "Lic. en Bioquímica": [
    { id: 'A0201', title: 'Álgebra', year: 1, completed: false, dependencies: [] },
    { id: 'A0202', title: 'Análisis Matemático I', year: 1, completed: false, dependencies: [] },
    { id: 'A0203', title: 'Introducción a la Química', year: 1, completed: false, dependencies: [] },
    { id: 'A0204', title: 'Física I', year: 1, completed: false, dependencies: ['A0201', 'A0202'] },
    { id: 'A0205', title: 'Análisis Matemático II', year: 1, completed: false, dependencies: ['A0201', 'A0202'] },
    { id: 'A0206', title: 'Química General', year: 1, completed: false, dependencies: ['A0201', 'A0202', 'A0203'] },
    { id: 'A0207', title: 'Física II', year: 2, completed: false, dependencies: ['A0204', 'A0205'] },
    { id: 'A0208', title: 'Biología', year: 2, completed: false, dependencies: ['A0203'] },
    { id: 'A0209', title: 'Química Inorgánica', year: 2, completed: false, dependencies: ['A0206'] },
    { id: 'A0210', title: 'Análisis de Datos', year: 2, completed: false, dependencies: ['A0205', 'A0206'] },
    { id: 'A0211', title: 'Fisicoquímica', year: 2, completed: false, dependencies: ['A0207', 'A0209', 'A0210'] },
    { id: 'A0212', title: 'Química Orgánica I', year: 2, completed: false, dependencies: ['A0209'] },
    { id: 'A0213', title: 'Química Analítica', year: 2, completed: false, dependencies: ['A0209', 'A0210'] },
    { id: 'U0206', title: 'Bioquímica I', year: 3, completed: false, dependencies: ['A0208', 'A0211', 'A0212', 'A0213'] },
    { id: 'U0212', title: 'Química Orgánica II', year: 3, completed: false, dependencies: ['A0212'] },
    { id: 'U0213', title: 'Química Analítica Instrumental', year: 3, completed: false, dependencies: ['A0213'] },
    { id: 'U0211', title: 'Ingles Técnico', year: 3, completed: false, dependencies: ['A0213', 'A0212', 'A0211'] },
    { id: 'U0201', title: 'Anatomía e Histología', year: 3, completed: false, dependencies: ['A0208'] },
    { id: 'U0207', title: 'Bioquímica II', year: 3, completed: false, dependencies: ['U0206', 'U0212'] },
    { id: 'U0208', title: 'Biofisicoquímica', year: 3, completed: false, dependencies: ['U0206', 'U0213'] },
    { id: 'U0203', title: 'Fisiología', year: 4, completed: false, dependencies: ['U0201'] },
    { id: 'U0205', title: 'Diseño de Experimentos', year: 4, completed: false, dependencies: ['U0206', 'U0213'] },
    { id: 'U0209', title: 'Bioquímica III', year: 4, completed: false, dependencies: ['U0206'] },
    { id: 'U0204', title: 'Microbiología General', year: 4, completed: false, dependencies: ['U0209'] },
    { id: 'B0203', title: 'Toxicología', year: 4, completed: false, dependencies: ['U0203', 'U0207'] },
    { id: 'B0204', title: 'Elementos de Farmacología', year: 4, completed: false, dependencies: ['U0203'] },
    { id: 'B0205', title: 'Hematología', year: 5, completed: false, dependencies: ['U0203', 'U0209'] },
    { id: 'B0206', title: 'Inmunología', year: 5, completed: false, dependencies: ['U0203', 'U0204', 'U0209'] },
    { id: 'B0207', title: 'Microbiología Clínica', year: 5, completed: false, dependencies: ['U0204'] },
    { id: 'B0208', title: 'Medio Interno', year: 5, completed: false, dependencies: ['B0205'] },
    { id: 'B0209', title: 'Micología', year: 5, completed: false, dependencies: ['U0204', 'B0206'] },
    { id: 'B0210', title: 'Química Clínica', year: 5, completed: false, dependencies: ['B0205'] },
    { id: 'B0211', title: 'Bromatología', year: 5, completed: false, dependencies: ['U0204'] },
    { id: 'B0212', title: 'Endocrinología', year: 6, completed: false, dependencies: ['B0210'] },
    { id: 'B0213', title: 'Bioquímica Patológica', year: 6, completed: false, dependencies: ['U0203', 'U0209'] },
    { id: 'B0214', title: 'Parasitología', year: 6, completed: false, dependencies: ['B0205'] },    
    { id: 'O0220', title: 'Virología Clínica', year: 6, completed: false, dependencies: ['U0204', 'B0206'] },
    { id: 'B0215', title: 'Medicina Interna', year: 6, completed: false, dependencies: ['B0212', 'B0213', 'B0214'] },
    { id: 'OPT-6.1', title: 'Materia Optativa 1', year: 6, completed: false, dependencies: [] },
    { id: 'OPT-6.2', title: 'Materia Optativa 2', year: 6, completed: false, dependencies: [] },
    { id: 'B0216', title: 'Prácticas de Laboratorio', year: 6, completed: false, dependencies: ['B0212', 'B0213', 'B0214'] }
  ],
  "Farmacia": [
    { id: 'A0201', title: 'Álgebra', year: 1, completed: false, dependencies: [] },
    { id: 'A0202', title: 'Análisis Matemático I', year: 1, completed: false, dependencies: [] },
    { id: 'A0203', title: 'Introducción a la Química', year: 1, completed: false, dependencies: [] },
    { id: 'A0204', title: 'Física I', year: 1, completed: false, dependencies: ['A0201', 'A0202'] },
    { id: 'A0205', title: 'Análisis Matemático II', year: 1, completed: false, dependencies: ['A0201', 'A0202'] },
    { id: 'A0206', title: 'Química General', year: 1, completed: false, dependencies: ['A0201', 'A0202', 'A0203'] },
    { id: 'AEFI', title: 'Ámbitos del Ej. Farmacéutico', year: 1, completed: false, dependencies: [] },
    { id: 'A0207', title: 'Física II', year: 2, completed: false, dependencies: ['A0204', 'A0205'] },
    { id: 'A0208', title: 'Biología', year: 2, completed: false, dependencies: ['A0203'] },
    { id: 'A0209', title: 'Química Inorgánica', year: 2, completed: false, dependencies: ['A0206'] },
    { id: 'A0210', title: 'Análisis de Datos', year: 2, completed: false, dependencies: ['A0205', 'A0206'] },
    { id: 'A0211', title: 'Fisicoquímica', year: 2, completed: false, dependencies: ['A0207', 'A0209', 'A0210'] },
    { id: 'A0212', title: 'Química Orgánica I', year: 2, completed: false, dependencies: ['A0209'] },
    { id: 'A0213', title: 'Química Analítica', year: 2, completed: false, dependencies: ['A0209', 'A0210'] },
    { id: 'AEFII', title: 'Ámbitos del Ej. Farmacéutico II', year: 2, completed: false, dependencies: ['AEFI'] },
    { id: 'U0211', title: 'Ingles Técnico', year: 2, completed: false, dependencies: ['A0207', 'A0208', 'A0209', 'A0210'] },
    { id: 'U0212', title: 'Química Organica II', year: 3, completed: false, dependencies: ['A0212'] },
    { id: 'U0213', title: 'Química Analítica Instrumental', year: 3, completed: false, dependencies: ['A0213'] },
    { id: 'U0201', title: 'Anatomía e Histología', year: 3, completed: false, dependencies: ['A0208'] },
    { id: 'F0201', title: 'Farmacobotánica', year: 3, completed: false, dependencies: ['A0208', 'A0212'] },
    { id: 'F0202', title: 'Farmacognosia', year: 3, completed: false, dependencies: ['U0212', 'U0213', 'F0201'] },
    { id: 'U0202', title: 'Química Biológica', year: 3, completed: false, dependencies: ['A0208', 'A0212'] },
    { id: 'F0216', title: 'Fisiología', year: 3, completed: false, dependencies: ['U0201'] },
    { id: 'AEFIII', title: 'Ámbitos del Ej. Farmacéutico III', year: 3, completed: false, dependencies: ['AEFII'] },
    { id: 'U0205', title: 'Diseño de Experimentos', year: 3, completed: false, dependencies: ['A0213'] },     
    { id: 'F0203', title: 'Fisiopatología', year: 4, completed: false, dependencies: ['F0216', 'U0202'] },
    { id: 'U0204', title: 'Microbiología General', year: 4, completed: false, dependencies: ['U0202'] },
    { id: 'F0204', title: 'Biofarmacia y Farmacocinética', year: 4, completed: false, dependencies: ['F0216', 'U0205'] },
    { id: 'F0205', title: 'Farmacología I', year: 4, completed: false, dependencies: ['F0203', 'F0204'] },
    { id: 'F0207', title: 'Tecnología Farmacéutica I', year: 4, completed: false, dependencies: ['A0211', 'F0204'] },
    { id: 'F0206', title: 'Nutricion y Bromatología', year: 4, completed: false, dependencies: ['F0216', 'U0202'] },
    { id: 'F0230', title: 'Inmunologia General y Aplicada', year: 4, completed: false, dependencies: ['F0216', 'U0204'] },
    { id: 'F0213', title: 'Control de Calidad de Med.', year: 5, completed: false, dependencies: ['U0205', 'U0212', 'U0213', 'F0207'] },
    { id: 'F0231', title: 'Biotecnología Farmacéutica', year: 5, completed: false, dependencies: ['U0204', 'F0207'] },
    { id: 'F0209', title: 'Higiene y Salúd Pública', year: 5, completed: false, dependencies: ['F0203', 'U0204'] },
    { id: 'F0208', title: 'Farmacología II', year: 5, completed: false, dependencies: ['U0204', 'F0205'] },
    { id: 'F0210', title: 'Química Medicinal', year: 5, completed: false, dependencies: ['A0211', 'F0202', 'F0205'] },
    { id: 'F0214', title: 'Farmacia Clínica y Asistencial', year: 5, completed: false, dependencies: ['F0204', 'F0208'] },
    { id: 'F0211', title: 'Eco. y Legis. Farmacéutica', year: 6, completed: false, dependencies: ['F0205', 'F0207'] },
    { id: 'TOX', title: 'Toxicología Farmacéutica', year: 6, completed: false, dependencies: ['F0205', 'F0208'] },
    { id: 'OPT-6.1', title: 'Materia Optativa 1', year: 6, completed: false, dependencies: [] },
    { id: 'OPT-6.2', title: 'Materia Optativa 2', year: 6, completed: false, dependencies: [] },
    { id: 'F0215', title: 'Práctica Farmacéutica', year: 6, completed: false, dependencies: ['F0209', 'F0212', 'F0213', 'F0214'] }
  ],
  "Lic. en Biotecnología": [
    { id: 'A0201', title: 'Álgebra', year: 1, completed: false, dependencies: [] },
    { id: 'A0202', title: 'Análisis Matemático I', year: 1, completed: false, dependencies: [] },
    { id: 'A0203', title: 'Introducción a la Química', year: 1, completed: false, dependencies: [] },
    { id: 'A0204', title: 'Física I', year: 1, completed: false, dependencies: ['A0201', 'A0202'] },
    { id: 'A0205', title: 'Análisis Matemático II', year: 1, completed: false, dependencies: ['A0201', 'A0202'] },
    { id: 'A0206', title: 'Química General', year: 1, completed: false, dependencies: ['A0201', 'A0202', 'A0203'] },
    { id: 'A0207', title: 'Física II', year: 2, completed: false, dependencies: ['A0204', 'A0205'] },
    { id: 'A0208', title: 'Biología', year: 2, completed: false, dependencies: ['A0203'] },
    { id: 'A0209', title: 'Química Inorgánica', year: 2, completed: false, dependencies: ['A0206'] },
    { id: 'A0210', title: 'Análisis de Datos', year: 2, completed: false, dependencies: ['A0205', 'A0206'] },
    { id: 'A0211', title: 'Fisicoquímica', year: 2, completed: false, dependencies: ['A0207', 'A0209', 'A0210'] },
    { id: 'A0212', title: 'Química Orgánica I', year: 2, completed: false, dependencies: ['A0209'] },
    { id: 'A0213', title: 'Química Analítica', year: 2, completed: false, dependencies: ['A0209', 'A0210'] },
    { id: 'U0206', title: 'Bioquímica I', year: 3, completed: false, dependencies: ['A0208', 'A0212', 'A0213'] },
    { id: 'U0212', title: 'Química Orgánica II', year: 3, completed: false, dependencies: ['A0212'] },
    { id: 'U0204', title: 'Microbiología General', year: 3, completed: false, dependencies: ['U0206'] },
    { id: 'U0213', title: 'Química Analítica Instrumental', year: 3, completed: false, dependencies: ['A0210', 'A0213'] },
    { id: 'U0210', title: 'Fenómenos de Transporte', year: 3, completed: false, dependencies: ['A0211'] },
    { id: 'U0207', title: 'Bioquímica II', year: 3, completed: false, dependencies: ['U0206', 'U0212'] },
    { id: 'U0208', title: 'Biofisicoquímica', year: 4, completed: false, dependencies: ['U0206', 'U0213'] },
    { id: 'U0209', title: 'Bioquímica III', year: 4, completed: false, dependencies: ['U0206'] },
    { id: 'T0202', title: 'Fisiología Animal', year: 4, completed: false, dependencies: ['U0207'] },
    { id: 'T0205', title: 'Biología Vegetal', year: 4, completed: false, dependencies: ['U0207'] },
    { id: 'T0203', title: 'Biología Celular Molecular', year: 4, completed: false, dependencies: ['U0207'] },
    { id: 'T0204', title: 'Ingeniería Genética', year: 4, completed: false, dependencies: ['U0207', 'U0209'] },
    { id: 'T0206', title: 'Biotecnología', year: 4, completed: false, dependencies: ['U0204', 'U0207'] },
    { id: 'T0207', title: 'Biotecnología II', year: 5, completed: false, dependencies: ['U0210', 'T0206'] },
    { id: 'T0208', title: 'Biotec. de Org. Superiores', year: 5, completed: false, dependencies: ['T0202', 'T0204', 'T0205'] },
    { id: 'T0209', title: 'Ingeniería Metabólica', year: 5, completed: false, dependencies: ['U0209', 'T0206'] },
    { id: 'T0210', title: 'Bioética y Bioseguridad', year: 5, completed: false, dependencies: ['U0209', 'U0204'] },
    { id: 'OPT-5.1', title: 'Materia Optativa 1', year: 5, completed: false, dependencies: [] },
    { id: 'OPT-5.2', title: 'Materia Optativa 2', year: 5, completed: false, dependencies: [] },
    { id: 'T0211', title: 'Laboratorio de Procesos Biotec.', year: 5, completed: false, dependencies: ['T0202', 'T0203', 'T0204', 'T0206'] }
  ],
  "Lic. en Química": [
    { id: 'A0201', title: 'Álgebra, C. Numérico y Geometría Anal.', year: 1, completed: false, dependencies: [] },
    { id: 'A0202', title: 'Análisis Matemático I', year: 1, completed: false, dependencies: [] },
    { id: 'A0203', title: 'Introducción a la Química', year: 1, completed: false, dependencies: [] },
    { id: 'A0204', title: 'Física I', year: 1, completed: false, dependencies: ['A0201', 'A0202'] },
    { id: 'A0205', title: 'Análisis Matemático II', year: 1, completed: false, dependencies: ['A0201', 'A0202'] },
    { id: 'A0206', title: 'Química General', year: 1, completed: false, dependencies: ['A0201', 'A0202', 'A0203'] },
    { id: 'A0207', title: 'Física II', year: 2, completed: false, dependencies: ['A0204', 'A0205'] },
    { id: 'A0208', title: 'Biología', year: 2, completed: false, dependencies: ['A0203'] },
    { id: 'A0209', title: 'Química Inorgánica', year: 2, completed: false, dependencies: ['A0206'] },
    { id: 'A0210', title: 'Análisis de Datos', year: 2, completed: false, dependencies: ['A0205', 'A0206'] },
    { id: 'A0211', title: 'Fisicoquímica', year: 2, completed: false, dependencies: ['A0207', 'A0209', 'A0210'] },
    { id: 'A0212', title: 'Química Orgánica I', year: 2, completed: false, dependencies: ['A0209'] },
    { id: 'A0213', title: 'Química Analítica', year: 2, completed: false, dependencies: ['A0209', 'A0210'] },
    { id: 'U0211', title: 'Inglés Científico Técnico', year: 3, completed: false, dependencies: ['A0211', 'A0212', 'A0213'] },
    { id: 'C0208', title: 'Introducción a la Microbiología', year: 3, completed: false, dependencies: ['A0208'] },
    { id: 'Q0201', title: 'Química Orgánica II', year: 3, completed: false, dependencies: ['A0212'] },
    { id: 'Q0202', title: 'Fisicoquímica II', year: 3, completed: false, dependencies: ['A0211'] },
    { id: 'Q0203', title: 'Química Analítica II', year: 3, completed: false, dependencies: ['A0207', 'A0213'] },
    { id: 'Q0205', title: 'Química Orgánica III', year: 3, completed: false, dependencies: ['Q0201'] },
    { id: 'Q0206', title: 'Fisicoquímica III', year: 3, completed: false, dependencies: ['Q0202'] },
    { id: 'Q0207', title: 'Química Analítica III', year: 3, completed: false, dependencies: ['Q0203'] },
    { id: 'Q0302', title: 'Higiene y Seguridad Laboral', year: 3, completed: false, dependencies: [] },
    { id: 'C0210', title: 'Toxicología General', year: 4, completed: false, dependencies: ['A0213'] },
    { id: 'Q0208', title: 'Determinación de Estructuras', year: 4, completed: false, dependencies: ['Q0205'] },
    { id: 'Q0209', title: 'Química Inorgánica II', year: 4, completed: false, dependencies: ['A0209', 'Q0202'] },
    { id: 'Q0210', title: 'Introducción a la Química Biológica', year: 4, completed: false, dependencies: ['A0208', 'Q0205'] },
    { id: 'Q0303', title: 'Química Industrial y de Materiales', year: 4, completed: false, dependencies: ['A0211'] },
    { id: 'Q0232', title: 'Análisis Orgánico', year: 4, completed: false, dependencies: ['Q0208'] },
    { id: 'Q0233', title: 'Mecanismos de Reacción en Q.O.', year: 4, completed: false, dependencies: ['Q0208'] },
    { id: 'Q0234', title: 'Trabajos Experimentales en Q.O. I', year: 4, completed: false, dependencies: ['Q0208'] },
    { id: 'Q0304', title: 'Química Ambiental', year: 4, completed: false, dependencies: ['A0208', 'A0213'] },
    { id: 'Q0235', title: 'Q.O. de Productos Naturales', year: 5, completed: false, dependencies: ['Q0208'] },
    { id: 'Q0236', title: 'Síntesis Orgánica I', year: 5, completed: false, dependencies: ['Q0233'] },
    { id: 'Q0237', title: 'Trabajos Experimentales en Q.O. II', year: 5, completed: false, dependencies: ['Q0232', 'Q0234'] },
    { id: 'Q0301', title: 'Bromatología', year: 5, completed: false, dependencies: ['A0208', 'Q0207'] },
    { id: 'Q0238', title: 'Síntesis Orgánica II', year: 5, completed: false, dependencies: ['Q0236'] },
    { id: 'OPT-5.1', title: 'Materia Optativa 1', year: 5, completed: false, dependencies: [] },
    { id: 'OPT-5.2', title: 'Materia Optativa 2', year: 5, completed: false, dependencies: [] },
    { id: 'Q0309', title: 'Trabajo Final', year: 5, completed: false, dependencies: [] }
  ],
  "Óptica Ocular y Optometría": [
    { id: 'A0201', title: 'Álgebra, C. Numérico y Geometría Anal.', year: 1, completed: false, dependencies: [] },
    { id: 'A0202', title: 'Análisis Matemático I', year: 1, completed: false, dependencies: [] },
    { id: 'A0203', title: 'Introducción a la Química', year: 1, completed: false, dependencies: [] },
    { id: 'A0204', title: 'Física I', year: 1, completed: false, dependencies: ['A0201', 'A0202'] },
    { id: 'A0205', title: 'Análisis Matemático II', year: 1, completed: false, dependencies: ['A0201', 'A0202'] },
    { id: 'A0206', title: 'Química General', year: 1, completed: false, dependencies: ['A0201', 'A0202', 'A0203'] },
    { id: 'A0207', title: 'Física II', year: 2, completed: false, dependencies: ['A0204', 'A0205'] },
    { id: 'A0208', title: 'Biología', year: 2, completed: false, dependencies: ['A0203'] },
    { id: 'P0201', title: 'Óptica Oftálmica I', year: 2, completed: false, dependencies: ['A0204', 'A0206'] },
    { id: 'U0201', title: 'Anatomía e Histología', year: 2, completed: false, dependencies: ['A0208'] },
    { id: 'P0202', title: 'Óptica Oftálmica II', year: 2, completed: false, dependencies: ['A0207', 'P0201'] },
    { id: 'P0220', title: 'Química Orgánica', year: 2, completed: false, dependencies: ['A0206'] },
    { id: 'A0210', title: 'Análisis de Datos', year: 3, completed: false, dependencies: ['A0205', 'A0206'] },
    { id: 'U0214', title: 'Física III', year: 3, completed: false, dependencies: ['A0207'] },
    { id: 'P0221', title: 'Química Orgánica II', year: 3, completed: false, dependencies: ['P0220'] },
    { id: 'P0222', title: 'Microbiología General', year: 3, completed: false, dependencies: ['A0208'] },
    { id: 'U0203', title: 'Fisiología', year: 3, completed: false, dependencies: ['U0201', 'P0222'] },
    { id: 'P0203', title: 'Seminario de Legisl., Admin. y Marketing', year: 3, completed: false, dependencies: ['A0210'] },
    { id: 'P0204', title: 'Química Biológica', year: 3, completed: false, dependencies: ['P0221', 'P0222'] },
    { id: 'P0205', title: 'Óptica Instrumental', year: 3, completed: false, dependencies: ['A0205', 'A0210', 'P0202'] },
    { id: 'P0206', title: 'Contactología', year: 4, completed: false, dependencies: ['U0203', 'P0202', 'P0204'] },
    { id: 'P0207', title: 'Fisiopatología Ocular', year: 4, completed: false, dependencies: ['U0203', 'P0222'] },
    { id: 'P0208', title: 'Optometría I', year: 4, completed: false, dependencies: ['U0203', 'P0204'] },
    { id: 'P0209', title: 'Farmacología', year: 4, completed: false, dependencies: ['P0208'] },
    { id: 'P0210', title: 'Higiene y Salud Pública', year: 4, completed: false, dependencies: ['P0204', 'P0222'] },
    { id: 'P0211', title: 'Contactología II', year: 4, completed: false, dependencies: ['P0206'] },
    { id: 'P0212', title: 'Optometría II', year: 5, completed: false, dependencies: ['P0208', 'P0209'] },
    { id: 'P0213', title: 'Optometría Pediátrica y Geriátrica', year: 5, completed: false, dependencies: ['P0208'] },
    { id: 'P0214', title: 'Ortóptica I', year: 5, completed: false, dependencies: ['P0208'] },
    { id: 'P0215', title: 'Optometría Clínica I', year: 5, completed: false, dependencies: ['P0207', 'P0208'] },
    { id: 'P0216', title: 'Optometría Clínica II', year: 5, completed: false, dependencies: ['P0215'] },
    { id: 'P0217', title: 'Baja Visión', year: 5, completed: false, dependencies: ['P0205', 'P0207', 'P0212'] },
    { id: 'P0218', title: 'Prótesis Ocular', year: 5, completed: false, dependencies: ['P0207'] },
    { id: 'P0219', title: 'Ortóptica II', year: 5, completed: false, dependencies: ['P0214'] }
  ],
  "Tec. Univ. en Química": [
    { id: 'A0201', title: 'Álgebra, C. Numérico y Geometría Anal.', year: 1, completed: false, dependencies: [] },
    { id: 'A0202', title: 'Análisis Matemático I', year: 1, completed: false, dependencies: [] },
    { id: 'A0203', title: 'Introducción a la Química', year: 1, completed: false, dependencies: [] },
    { id: 'A0204', title: 'Física I', year: 1, completed: false, dependencies: ['A0201', 'A0202'] },
    { id: 'A0205', title: 'Análisis Matemático II', year: 1, completed: false, dependencies: ['A0201', 'A0202'] },
    { id: 'A0206', title: 'Química General', year: 1, completed: false, dependencies: ['A0201', 'A0202', 'A0203'] },
    { id: 'A0207', title: 'Física II', year: 2, completed: false, dependencies: ['A0204', 'A0205'] },
    { id: 'A0208', title: 'Biología', year: 2, completed: false, dependencies: ['A0203'] },
    { id: 'A0209', title: 'Química Inorgánica', year: 2, completed: false, dependencies: ['A0206'] },
    { id: 'A0210', title: 'Análisis de Datos', year: 2, completed: false, dependencies: ['A0205', 'A0206'] },
    { id: 'A0212', title: 'Química Orgánica I', year: 2, completed: false, dependencies: ['A0209'] },
    { id: 'A0213', title: 'Química Analítica', year: 2, completed: false, dependencies: ['A0209', 'A0210'] },
    { id: 'N0102', title: 'Microbiología General', year: 2, completed: false, dependencies: ['A0208'] },
    { id: 'U0212', title: 'Química Orgánica II', year: 3, completed: false, dependencies: ['A0212'] },
    { id: 'U0213', title: 'Química Analítica Instrumental', year: 3, completed: false, dependencies: ['A0210', 'A0213'] },
    { id: 'N0103', title: 'Introducción a la Química Biológica', year: 3, completed: false, dependencies: ['A0208', 'A0212', 'A0213'] }
  ],
  "Lic. en Cs. de Alimentos": [
    { id: 'A0201', title: 'Álgebra, C. Numérico y Geometría Anal.', year: 1, completed: false, dependencies: [] },
    { id: 'A0202', title: 'Análisis Matemático I', year: 1, completed: false, dependencies: [] },
    { id: 'A0203', title: 'Introducción a la Química', year: 1, completed: false, dependencies: [] },
    { id: 'A0204', title: 'Física I', year: 1, completed: false, dependencies: ['A0201', 'A0202'] },
    { id: 'A0205', title: 'Análisis Matemático II', year: 1, completed: false, dependencies: ['A0201', 'A0202'] },
    { id: 'A0206', title: 'Química General', year: 1, completed: false, dependencies: ['A0201', 'A0202', 'A0203'] },
    { id: 'A0207', title: 'Física II', year: 2, completed: false, dependencies: ['A0204', 'A0205'] },
    { id: 'A0208', title: 'Biología', year: 2, completed: false, dependencies: ['A0203'] },
    { id: 'A0209', title: 'Química Inorgánica', year: 2, completed: false, dependencies: ['A0206'] },
    { id: 'A0210', title: 'Análisis de Datos', year: 2, completed: false, dependencies: ['A0205', 'A0206'] },
    { id: 'A0211', title: 'Fisicoquímica', year: 2, completed: false, dependencies: ['A0207', 'A0209', 'A0210'] },
    { id: 'A0212', title: 'Química Orgánica I', year: 2, completed: false, dependencies: ['A0209'] },
    { id: 'A0213', title: 'Química Analítica', year: 2, completed: false, dependencies: ['A0209', 'A0210'] },
    { id: 'U0206', title: 'Bioquímica I', year: 3, completed: false, dependencies: ['A0208', 'A0212', 'A0213'] },
    { id: 'U0212', title: 'Química Orgánica II', year: 3, completed: false, dependencies: ['A0212'] },
    { id: 'U0213', title: 'Química Analítica Instrumental', year: 3, completed: false, dependencies: ['A0213'] },
    { id: 'U0204', title: 'Microbiología General', year: 3, completed: false, dependencies: ['A0208', 'U0206'] },
    { id: 'L0201', title: 'Bioquímica II', year: 3, completed: false, dependencies: ['U0206'] },
    { id: 'U0210', title: 'Fenómenos de Transporte', year: 3, completed: false, dependencies: ['A0211'] },
    { id: 'U0205', title: 'Diseño de Experimentos', year: 4, completed: false, dependencies: ['A0210', 'A0211', 'U0213'] },
    { id: 'L0202', title: 'Prop. Físicas y Químicas de Alimentos I', year: 4, completed: false, dependencies: ['U0210', 'U0212'] },
    { id: 'L0203', title: 'Operaciones y Procesos de Separación', year: 4, completed: false, dependencies: ['A0211', 'U0210'] },
    { id: 'L0204', title: 'Alimentos y Salud', year: 4, completed: false, dependencies: ['U0206'] },
    { id: 'L0205', title: 'Prop. Físicas y Químicas de Alimentos II', year: 4, completed: false, dependencies: ['L0202'] },
    { id: 'L0206', title: 'Procesamiento de Alimentos I', year: 4, completed: false, dependencies: ['L0202', 'L0203'] },
    { id: 'L0207', title: 'Análisis de Alimentos', year: 4, completed: false, dependencies: ['U0213', 'L0202'] },
    { id: 'L0208', title: 'Microbiología de Alimentos', year: 4, completed: false, dependencies: ['U0204', 'L0201'] },
    { id: 'L0209', title: 'Procesamiento de Alimentos II', year: 5, completed: false, dependencies: ['L0206'] },
    { id: 'L0210', title: 'Calidad e Higiene de Alimentos', year: 5, completed: false, dependencies: ['L0205', 'L0206', 'L0207'] },
    { id: 'L0211', title: 'Eval. Económica y Planeamiento Ind.', year: 5, completed: false, dependencies: ['L0206'] },
    { id: 'L0212', title: 'Bioindustrias Alimentarias', year: 5, completed: false, dependencies: ['L0206', 'L0208'] },
    { id: 'OPT-5.1', title: 'Materia Optativa 1', year: 5, completed: false, dependencies: [] },
    { id: 'L0214', title: 'Toxicología de Alimentos', year: 5, completed: false, dependencies: ['L0201', 'L0204', 'L0205'] },
    { id: 'L0215', title: 'Industrias Alimentarias', year: 5, completed: false, dependencies: ['L0207', 'L0209'] },
    { id: 'L0216', title: 'Trabajo Final', year: 5, completed: false, dependencies: [] }
  ],
  "Tec. Univ. en Alimentos": [
    { id: 'A0201', title: 'Álgebra, C. Numérico y Geometría Anal.', year: 1, completed: false, dependencies: [] },
    { id: 'A0202', title: 'Análisis Matemático I', year: 1, completed: false, dependencies: [] },
    { id: 'A0203', title: 'Introducción a la Química', year: 1, completed: false, dependencies: [] },
    { id: 'A0204', title: 'Física I', year: 1, completed: false, dependencies: ['A0201', 'A0202'] },
    { id: 'A0205', title: 'Análisis Matemático II', year: 1, completed: false, dependencies: ['A0201', 'A0202'] },
    { id: 'A0206', title: 'Química General', year: 1, completed: false, dependencies: ['A0201', 'A0202', 'A0203'] },
    { id: 'A0207', title: 'Física II', year: 2, completed: false, dependencies: ['A0204', 'A0205'] },
    { id: 'A0208', title: 'Biología', year: 2, completed: false, dependencies: ['A0203'] },
    { id: 'A0209', title: 'Química Inorgánica', year: 2, completed: false, dependencies: ['A0206'] },
    { id: 'A0210', title: 'Análisis de Datos', year: 2, completed: false, dependencies: ['A0205', 'A0206'] },
    { id: 'A0211', title: 'Fisicoquímica', year: 2, completed: false, dependencies: ['A0207', 'A0209', 'A0210'] },
    { id: 'A0212', title: 'Química Orgánica I', year: 2, completed: false, dependencies: ['A0209'] },
    { id: 'A0213', title: 'Química Analítica', year: 2, completed: false, dependencies: ['A0209', 'A0210'] },
    { id: 'U0206', title: 'Bioquímica I', year: 3, completed: false, dependencies: ['A0208', 'A0212', 'A0213'] },
    { id: 'U0212', title: 'Química Orgánica II', year: 3, completed: false, dependencies: ['A0212'] },
    { id: 'U0213', title: 'Química Analítica Instrumental', year: 3, completed: false, dependencies: ['A0213'] },
    { id: 'U0204', title: 'Microbiología General', year: 3, completed: false, dependencies: ['A0208', 'U0206'] },
    { id: 'L0201', title: 'Bioquímica II', year: 3, completed: false, dependencies: ['U0206'] },
    { id: 'U0210', title: 'Fenómenos de Transporte', year: 3, completed: false, dependencies: ['A0211'] },
    { id: 'U0205', title: 'Diseño de Experimentos', year: 4, completed: false, dependencies: ['A0210', 'A0211', 'U0213'] },
    { id: 'L0202', title: 'Prop. Físicas y Químicas de Alimentos I', year: 4, completed: false, dependencies: ['U0210', 'U0212'] },
    { id: 'L0203', title: 'Op. y Procesos de Separación', year: 4, completed: false, dependencies: ['A0211', 'U0210'] },
    { id: 'L0204', title: 'Alimentos y Salud', year: 4, completed: false, dependencies: ['U0206'] },
    { id: 'L0205', title: 'Prop. Físicas y Químicas de Alimentos II', year: 4, completed: false, dependencies: ['L0202'] },
    { id: 'L0206', title: 'Procesamiento de Alimentos I', year: 4, completed: false, dependencies: ['L0202', 'L0203'] },
    { id: 'L0207', title: 'Análisis de Alimentos', year: 4, completed: false, dependencies: ['U0213', 'L0202'] },
    { id: 'L0208', title: 'Microbiología de Alimentos', year: 4, completed: false, dependencies: ['U0204', 'L0201'] }
  ],
  "Química y Tec. Ambiental": [
    { id: 'A0201', title: 'Álgebra, C. Numérico y Geometría Anal.', year: 1, completed: false, dependencies: [] },
    { id: 'A0202', title: 'Análisis Matemático I', year: 1, completed: false, dependencies: [] },
    { id: 'A0203', title: 'Introducción a la Química', year: 1, completed: false, dependencies: [] },
    { id: 'A0204', title: 'Física I', year: 1, completed: false, dependencies: ['A0201', 'A0202'] },
    { id: 'A0205', title: 'Análisis Matemático II', year: 1, completed: false, dependencies: ['A0201', 'A0202'] },
    { id: 'A0206', title: 'Química General', year: 1, completed: false, dependencies: ['A0201', 'A0202', 'A0203'] },
    { id: 'A0207', title: 'Física II', year: 2, completed: false, dependencies: ['A0204', 'A0205'] },
    { id: 'A0208', title: 'Biología', year: 2, completed: false, dependencies: ['A0203'] },
    { id: 'A0209', title: 'Química Inorgánica', year: 2, completed: false, dependencies: ['A0206'] },
    { id: 'A0210', title: 'Análisis de Datos', year: 2, completed: false, dependencies: ['A0205', 'A0206'] },
    { id: 'A0211', title: 'Fisicoquímica', year: 2, completed: false, dependencies: ['A0207', 'A0209', 'A0210'] },
    { id: 'A0212', title: 'Química Orgánica I', year: 2, completed: false, dependencies: ['A0209'] },
    { id: 'A0213', title: 'Química Analítica', year: 2, completed: false, dependencies: ['A0209', 'A0210'] },
    { id: 'U0211', title: 'Inglés Científico Técnico', year: 3, completed: false, dependencies: ['A0211', 'A0212', 'A0213'] },
    { id: 'C0201', title: 'Química Orgánica II', year: 3, completed: false, dependencies: ['A0212'] },
    { id: 'U0213', title: 'Química Analítica Instrumental', year: 3, completed: false, dependencies: ['A0213'] },
    { id: 'C0202', title: 'Introducción a las Ciencias Ambientales', year: 3, completed: false, dependencies: ['A0208', 'A0211', 'A0213'] },
    { id: 'C0204', title: 'Radioactividad y Medio Ambiente', year: 3, completed: false, dependencies: ['A0207', 'A0209'] },
    { id: 'C0205', title: 'Fisicoquímica Ambiental', year: 3, completed: false, dependencies: ['A0211', 'C0202'] },
    { id: 'C0206', title: 'Química Biológica', year: 3, completed: false, dependencies: ['A0208', 'A0211', 'A0213', 'C0201'] },
    { id: 'C0220', title: 'Fenómenos de Transporte', year: 3, completed: false, dependencies: ['A0205', 'A0211'] },
    { id: 'U0205', title: 'Diseño de Experimentos', year: 4, completed: false, dependencies: ['A0210', 'A0211'] },
    { id: 'C0207', title: 'Introducción a la Biofisicoquímica', year: 4, completed: false, dependencies: ['A0211', 'C0206'] },
    { id: 'C0208', title: 'Introducción a la Microbiología', year: 4, completed: false, dependencies: ['C0206'] },
    { id: 'C0209', title: 'Química Analítica Ambiental', year: 4, completed: false, dependencies: ['U0213'] },
    { id: 'C0221', title: 'Toxicología General', year: 4, completed: false, dependencies: ['A0213', 'C0206'] },
    { id: 'C0211', title: 'Ecología Microbiana', year: 4, completed: false, dependencies: ['U0213', 'C0208'] },
    { id: 'C0212', title: 'Tecnologías Reducción de Contaminantes', year: 4, completed: false, dependencies: ['C0205', 'C0220'] },
    { id: 'C0213', title: 'Ecotoxicología y Evaluación de Riesgos', year: 4, completed: false, dependencies: ['C0209', 'C0221'] },
    { id: 'C0214', title: 'Tratamientos Biológicos Reducc. Contam.', year: 5, completed: false, dependencies: ['C0209', 'C0211', 'C0220'] },
    { id: 'C0215', title: 'Tecnologías Ecocompatibles', year: 5, completed: false, dependencies: ['C0212'] },
    { id: 'C0216', title: 'Modelos de Dispersión Contaminantes', year: 5, completed: false, dependencies: ['C0205', 'C0209'] },
    { id: 'OPT-5.1', title: 'Materia Optativa I', year: 5, completed: false, dependencies: [] },
    { id: 'C0218', title: 'Gestión y Diagnóstico Ambiental', year: 5, completed: false, dependencies: ['C0213', 'C0215'] },
    { id: 'OPT-5.2', title: 'Materia Optativa II', year: 5, completed: false, dependencies: [] },
    { id: 'C0219', title: 'Trabajo Final', year: 5, completed: false, dependencies: [] }
  ]
};

// Generamos la lista de carreras a partir del diccionario (Asegura que sean idénticas)
const CARRERAS = Object.keys(STUDY_PLANS);

const INITIAL_AGENDA = [
  { id: '1', title: 'Inscripción a materias', date: '15/03', time: '08:00 hs', color: '#10B981' },
];

// ==========================================
// 2. COMPONENTES ANIMADOS: ESPACIO
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

// ==========================================
// 3. COMPONENTES ANIMADOS: QUÍMICA/LABORATORIO
// ==========================================

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
// 4. COMPONENTE PRINCIPAL (APP)
// ==========================================
export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userCareer, setUserCareer] = useState('');
  const [careerModalVisible, setCareerModalVisible] = useState(false);

  const [activeTab, setActiveTab] = useState('Plan');
  const [plan, setPlan] = useState([]);
  const [agenda, setAgenda] = useState(INITIAL_AGENDA);
  
  const [agendaModalVisible, setAgendaModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');

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

  const handleLogin = () => {
    if (email.trim() !== '' && password !== '' && userCareer !== '') {
      setPlan(STUDY_PLANS[userCareer] || []);
      setIsAuthenticated(true);
    } else {
      Alert.alert("Acceso Denegado", "Completá todos los campos para ingresar al portal.");
    }
  };

  const isSubjectUnlocked = (subject) => {
    if (!subject.dependencies || subject.dependencies.length === 0) return true;
    return subject.dependencies.every(depId => {
      const dep = plan.find(s => s.id === depId);
      return dep && dep.completed;
    });
  };

  const handleSubjectPress = (subject) => {
    if (isSubjectUnlocked(subject)) {
      setPlan(plan.map(subj => subj.id === subject.id ? { ...subj, completed: !subj.completed } : subj));
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

      Alert.alert(
        "Materia Bloqueada 🔒", 
        `Para cursar "${subject.title}" debes aprobar:\n\n• ${missingDeps}`
      );
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

  const addAgendaItem = () => {
    if (newTitle && newDate) {
      setAgenda([...agenda, { id: Math.random().toString(), title: newTitle, date: newDate, time: newTime || 'Todo el día', color: theme.primary }]);
      setAgendaModalVisible(false);
      setNewTitle(''); setNewDate(''); setNewTime('');
    }
  };

  // Asignamos el componente dinámico a una variable que React entienda
  const DynamicBackground = theme.Background;

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
              <View style={styles.inputContainerDark}>
                <Ionicons name="mail" size={20} color={theme.primary} style={styles.inputIcon} />
                <TextInput style={styles.inputDark} placeholder="alumno@exactas.unlp.edu.ar" placeholderTextColor="#64748B" value={email} onChangeText={setEmail} autoCapitalize="none"/>
              </View>

              <View style={styles.inputContainerDark}>
                <Ionicons name="lock-closed" size={20} color={theme.primary} style={styles.inputIcon} />
                <TextInput style={styles.inputDark} placeholder="Contraseña de acceso" placeholderTextColor="#64748B" secureTextEntry value={password} onChangeText={setPassword}/>
              </View>

              <TouchableOpacity style={styles.selectorButtonDark} onPress={() => setCareerModalVisible(true)}>
                <View style={{flexDirection: 'row', alignItems: 'center', flex: 1}}>
                  <Ionicons name="school" size={20} color={theme.primary} style={styles.inputIcon} />
                  <Text style={[styles.selectorTextDark, !userCareer && {color: '#64748B'}]} numberOfLines={1}>
                    {userCareer ? userCareer : "Selecciona tu carrera..."}
                  </Text>
                </View>
                <Ionicons name="chevron-down" size={20} color="#64748B" />
              </TouchableOpacity>

              <TouchableOpacity style={[styles.loginButton, { backgroundColor: theme.secondary, shadowColor: theme.primary }]} onPress={handleLogin} activeOpacity={0.8}>
                <Text style={styles.loginButtonText}>{theme.actionText}</Text>
                <Ionicons name={theme.actionIcon} size={20} color="#FFF" />
              </TouchableOpacity>
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
          <Text style={styles.screenTitleLight}>Plan de Estudio</Text>
        </View>
        <TouchableOpacity onPress={() => setIsAuthenticated(false)} style={[styles.avatarPlaceholderDark, { borderColor: theme.bgLight }]}>
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

  const renderAgenda = () => (
    <View style={[styles.screenContainer, {flex: 1}]}>
      <Text style={styles.screenTitleLight}>Mi Agenda</Text>
      <Text style={styles.sectionSubtitleDark}>Bitácora Académica</Text>
      <ScrollView showsVerticalScrollIndicator={false} style={{marginTop: 10}}>
        {agenda.map((item) => (
          <View key={item.id} style={styles.agendaCardGlass}>
            <View style={[styles.agendaColorBar, {backgroundColor: theme.primary}]} />
            <View style={styles.agendaDateBoxDark}>
              <Text style={styles.agendaDayLight}>{item.date.split('/')[0]}</Text>
              <Text style={[styles.agendaMonthDark, { color: theme.primary }]}>{item.date.split('/')[1]}</Text>
            </View>
            <View style={styles.agendaDetails}>
              <Text style={styles.agendaItemTitleLight}>{item.title}</Text>
              <View style={styles.agendaTimeRow}>
                <Ionicons name="time" size={14} color="#94A3B8" />
                <Text style={styles.agendaItemTimeDark}>{item.time}</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
      <TouchableOpacity style={[styles.fabBtnDark, { backgroundColor: theme.secondary, shadowColor: theme.primary }]} onPress={() => setAgendaModalVisible(true)}>
        <Ionicons name="add" size={28} color="#FFF" />
      </TouchableOpacity>

      <Modal animationType="slide" transparent={true} visible={agendaModalVisible}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlayDark}>
          <View style={styles.modalSheetDark}>
            <View style={styles.sheetHandleDark} />
            <Text style={styles.sheetTitleLight}>Añadir a Bitácora</Text>
            <View style={styles.sheetInputGroup}>
              <Text style={styles.sheetLabelDark}>Evento o Materia</Text>
              <TextInput style={styles.sheetInputDark} placeholder="Ej. Parcial Álgebra" placeholderTextColor="#64748B" value={newTitle} onChangeText={setNewTitle} />
            </View>
            <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
              <View style={[styles.sheetInputGroup, {width: '48%'}]}>
                <Text style={styles.sheetLabelDark}>Fecha (DD/MM)</Text>
                <TextInput style={styles.sheetInputDark} placeholder="Ej. 10/05" placeholderTextColor="#64748B" value={newDate} onChangeText={setNewDate} />
              </View>
              <View style={[styles.sheetInputGroup, {width: '48%'}]}>
                <Text style={styles.sheetLabelDark}>Hora</Text>
                <TextInput style={styles.sheetInputDark} placeholder="Ej. 14:00" placeholderTextColor="#64748B" value={newTime} onChangeText={setNewTime} />
              </View>
            </View>
            <TouchableOpacity style={[styles.sheetSaveBtnDark, { backgroundColor: theme.secondary }]} onPress={addAgendaItem}>
              <Text style={styles.sheetSaveText}>Guardar Evento</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: isSpaceTheme ? '#050519' : '#022C22' }}>
      <StatusBar barStyle="light-content" backgroundColor={isSpaceTheme ? '#050519' : '#022C22'} />
      <DynamicBackground />

      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.content}>
          {activeTab === 'Plan' && renderPlan()}
          {activeTab === 'Agenda' && renderAgenda()}
        </View>

        <View style={styles.bottomNavDark}>
          <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('Agenda')}>
            <Ionicons name={activeTab === 'Agenda' ? "calendar" : "calendar-outline"} size={24} color={activeTab === 'Agenda' ? theme.primary : "#64748B"} />
            <Text style={[styles.navTextDark, activeTab === 'Agenda' && { color: theme.primary, fontWeight: '900' }]}>Agenda</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('Plan')}>
            <View style={[styles.navCenterBtnDark, activeTab === 'Plan' && { backgroundColor: theme.secondary, shadowColor: theme.primary, borderColor: theme.primary, elevation: 6 }]}>
              <Ionicons name="git-network" size={28} color={activeTab === 'Plan' ? "#FFF" : "#94A3B8"} />
            </View>
            <Text style={[styles.navTextDark, activeTab === 'Plan' && { color: theme.primary, fontWeight: '900' }, {marginTop: 5}]}>Plan</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => Alert.alert("Fase 2", "El Mercado Drive estará disponible en la próxima actualización.")}>
            <Ionicons name="library-outline" size={24} color="#64748B" />
            <Text style={styles.navTextDark}>Mercado</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

// ==========================================
// 5. ESTILOS BASE
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
  glassCard: { backgroundColor: 'rgba(15, 23, 42, 0.65)', padding: 25, borderRadius: 30, borderWidth: 1 },
  inputContainerDark: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(30, 41, 59, 0.9)', borderRadius: 16, paddingHorizontal: 15, marginBottom: 15, borderWidth: 1, borderColor: '#334155' },
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

  agendaCardGlass: { flexDirection: 'row', backgroundColor: 'rgba(15, 23, 42, 0.75)', borderRadius: 20, marginBottom: 15, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  agendaColorBar: { width: 6, height: '100%' },
  agendaDateBoxDark: { padding: 15, alignItems: 'center', justifyContent: 'center', borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.1)', width: 80, backgroundColor: 'rgba(0,0,0,0.2)' },
  agendaDayLight: { fontSize: 26, fontWeight: '900', color: '#FFF' },
  agendaMonthDark: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  agendaItemTitleLight: { fontSize: 16, fontWeight: '800', color: '#F8FAFC', marginBottom: 6 },
  agendaItemTimeDark: { fontSize: 14, color: '#94A3B8', marginLeft: 6, fontWeight: '600' },
  fabBtnDark: { position: 'absolute', bottom: 30, right: 24, width: 65, height: 65, borderRadius: 32.5, justifyContent: 'center', alignItems: 'center', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 15, elevation: 8 },

  modalSheetDark: { backgroundColor: '#0F172A', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 25, borderWidth: 1, borderColor: '#334155' },
  sheetHandleDark: { width: 40, height: 5, backgroundColor: '#334155', borderRadius: 3, alignSelf: 'center', marginBottom: 20 },
  sheetTitleLight: { fontSize: 24, fontWeight: '900', color: '#FFF', marginBottom: 25 },
  sheetLabelDark: { fontSize: 14, fontWeight: '800', color: '#94A3B8', marginBottom: 8 },
  sheetInputDark: { backgroundColor: 'rgba(30, 41, 59, 0.8)', borderWidth: 1, borderColor: '#334155', borderRadius: 16, padding: 16, fontSize: 16, color: '#FFF', fontWeight: '500' },
  sheetSaveBtnDark: { borderRadius: 16, padding: 18, alignItems: 'center', marginTop: 15, marginBottom: Platform.OS === 'ios' ? 20 : 0 },

  bottomNavDark: { flexDirection: 'row', backgroundColor: 'rgba(15, 23, 42, 0.95)', paddingVertical: 10, paddingBottom: Platform.OS === 'ios' ? 30 : 15, borderTopWidth: 1, borderColor: '#334155', justifyContent: 'space-around', alignItems: 'flex-end' },
  navCenterBtnDark: { backgroundColor: 'rgba(30, 41, 59, 0.8)', width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: -5, borderWidth: 1, borderColor: '#334155' },
  navTextDark: { color: '#64748B', fontSize: 12, fontWeight: '800', marginTop: 4 },
});