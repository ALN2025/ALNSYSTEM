import React, { Component, ReactNode } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Colors, FontSize, Spacing } from '../constants/theme';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <View style={styles.root}>
          <Text style={styles.title}>Meu Controle</Text>
          <Text style={styles.msg}>Algo deu errado ao abrir o app.</Text>
          <Text style={styles.detail} numberOfLines={6}>{this.state.error.message}</Text>
          <Pressable style={styles.btn} onPress={() => this.setState({ error: null })}>
            <Text style={styles.btnText}>Tentar novamente</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  title: {
    color: Colors.primaryLight,
    fontSize: FontSize.xl,
    fontWeight: '800',
    marginBottom: Spacing.md,
  },
  msg: {
    color: Colors.text,
    fontSize: FontSize.md,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  detail: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  btn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: 10,
  },
  btnText: {
    color: '#fff',
    fontWeight: '700',
  },
});
