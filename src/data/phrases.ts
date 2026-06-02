import type { Phrase } from "../types";

export const PHRASE_CATEGORIES: { id: Phrase["category"]; label: string }[] = [
  { id: "lancha", label: "Boat" },
  { id: "taxi", label: "Taxi / Ride" },
  { id: "restaurant", label: "Food" },
  { id: "altitude", label: "Altitude" },
  { id: "general", label: "General" },
];

export const PHRASES: Phrase[] = [
  { id: "l1", category: "lancha", spanish: "La lancha a Santa Cruz, por favor", english: "Boat to Santa Cruz, please" },
  { id: "l2", category: "lancha", spanish: "¿A qué hora sale el último barco?", english: "What time is the last boat?" },
  { id: "l3", category: "lancha", spanish: "¿Cuánto cuesta la lancha?", english: "How much is the boat?" },
  { id: "l4", category: "lancha", spanish: "Quiero ir a San Marcos", english: "I want to go to San Marcos" },
  { id: "l5", category: "lancha", spanish: "¿Hay lancha directa?", english: "Is there a direct boat?" },
  { id: "t1", category: "taxi", spanish: "Al aeropuerto, por favor", english: "To the airport, please" },
  { id: "t2", category: "taxi", spanish: "A La Casa del Mundo en Santa Cruz", english: "To La Casa del Mundo in Santa Cruz" },
  { id: "t3", category: "taxi", spanish: "¿Cuánto cuesta a Antigua?", english: "How much to Antigua?" },
  { id: "t4", category: "taxi", spanish: "Pare aquí, por favor", english: "Stop here, please" },
  { id: "t5", category: "taxi", spanish: "Tengo reserva en este hotel", english: "I have a reservation at this hotel" },
  { id: "r1", category: "restaurant", spanish: "La cuenta, por favor", english: "The check, please" },
  { id: "r2", category: "restaurant", spanish: "¿Tienen opciones vegetarianas?", english: "Do you have vegetarian options?" },
  { id: "r3", category: "restaurant", spanish: "Sin picante, por favor", english: "Not spicy, please" },
  { id: "r4", category: "restaurant", spanish: "Una cerveza / agua, por favor", english: "A beer / water, please" },
  { id: "r5", category: "restaurant", spanish: "Está delicioso", english: "It's delicious" },
  { id: "a1", category: "altitude", spanish: "Me duele la cabeza", english: "I have a headache" },
  { id: "a2", category: "altitude", spanish: "Me siento mareado/a", english: "I feel dizzy" },
  { id: "a3", category: "altitude", spanish: "Necesito descansar un momento", english: "I need to rest a moment" },
  { id: "a4", category: "altitude", spanish: "¿Hay agua potable?", english: "Is there drinking water?" },
  { id: "g1", category: "general", spanish: "¿Cuánto cuesta?", english: "How much does it cost?" },
  { id: "g2", category: "general", spanish: "¿Dónde está el baño?", english: "Where is the bathroom?" },
  { id: "g3", category: "general", spanish: "Gracias, muy amable", english: "Thank you, very kind" },
  { id: "g4", category: "general", spanish: "No entiendo. ¿Puede repetir?", english: "I don't understand. Can you repeat?" },
  { id: "g5", category: "general", spanish: "¿Aceptan tarjeta?", english: "Do you accept card?" },
  { id: "g6", category: "general", spanish: "Solo efectivo. ¿Dónde hay un cajero?", english: "Cash only. Where is an ATM?" },
];
