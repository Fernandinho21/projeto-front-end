import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, AppRole } from '../types';

const USERS_KEY = '@biblioteca:users';

export type RegisteredUser = User & {
  loginCode: string;
  password: string;
  role: AppRole;
};

// Usuários fixos do sistema
const defaultUsers: RegisteredUser[] = [
  {
    id: 'LEITOR01',
    loginCode: 'LEITOR01',
    password: '123456',
    name: 'Leitor',
    email: 'leitor01@biblioteca.local',
    phone: '',
    registrationDate: new Date(),
    activeLoans: 0,
    role: 'user',
  },
  {
    id: 'BIB01',
    loginCode: 'BIB01',
    password: '456123',
    name: 'Bibliotecario',
    email: 'bib01@biblioteca.local',
    phone: '',
    registrationDate: new Date(),
    role: 'librarian',
  },
  {
    id: 'ADM01',
    loginCode: 'ADM01',
    password: '763824',
    name: 'Administrador',
    email: 'adm01@biblioteca.local',
    phone: '',
    registrationDate: new Date(),
    role: 'admin',
  },
];

const parseUser = (u: any): RegisteredUser => ({
  ...u,
  registrationDate: u.registrationDate ? new Date(u.registrationDate) : new Date(),
});

export const userService = {
  async getAll(): Promise<RegisteredUser[]> {
    try {
      const data = await AsyncStorage.getItem(USERS_KEY);
      const saved: RegisteredUser[] = data ? JSON.parse(data).map(parseUser) : [];
      return [...defaultUsers, ...saved];
    } catch {
      return [...defaultUsers];
    }
  },

  async findByCredentials(loginCode: string, password: string, role: AppRole): Promise<RegisteredUser | null> {
    const users = await this.getAll();
    return users.find(
      (u) =>
        u.loginCode.toUpperCase() === loginCode.toUpperCase() &&
        u.password === password &&
        u.role === role
    ) ?? null;
  },

  async loginExists(loginCode: string): Promise<boolean> {
    const users = await this.getAll();
    return users.some((u) => u.loginCode.toUpperCase() === loginCode.toUpperCase());
  },

  async register(data: {
    name: string;
    email: string;
    phone: string;
    loginCode: string;
    password: string;
    role: AppRole;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const exists = await this.loginExists(data.loginCode);
      if (exists) {
        return { success: false, error: 'Este login já está em uso. Escolha outro.' };
      }

      const stored = await AsyncStorage.getItem(USERS_KEY);
      const saved: RegisteredUser[] = stored ? JSON.parse(stored) : [];

      const newUser: RegisteredUser = {
        id: data.loginCode.toUpperCase(),
        loginCode: data.loginCode.toUpperCase(),
        password: data.password,
        name: data.name,
        email: data.email,
        phone: data.phone,
        registrationDate: new Date(),
        activeLoans: data.role === 'user' ? 0 : undefined,
        role: data.role,
      };

      saved.push(newUser);
      await AsyncStorage.setItem(USERS_KEY, JSON.stringify(saved));
      return { success: true };
    } catch {
      return { success: false, error: 'Erro ao cadastrar. Tente novamente.' };
    }
  },
};