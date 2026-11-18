import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { cores } from '../theme';

interface CartaoProps {
  titulo?: string;
  children: ReactNode;
}

export function Cartao({ titulo, children }: CartaoProps) {
  return (
    <View style={estilos.cartao}>
      {titulo ? <Text style={estilos.titulo}>{titulo}</Text> : null}
      {children}
    </View>
  );
}

const estilos = StyleSheet.create({
  cartao: {
    backgroundColor: cores.cartao,
    borderColor: cores.borda,
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    gap: 12,
  },
  titulo: { color: cores.texto, fontSize: 17, fontWeight: '600' },
});
