/**
 * Admin Service - Business logic for admin authentication and management
 */

import { prisma } from '@/lib/prisma';
import { Admin } from '@prisma/client';
import { hashPassword, verifyPassword } from '@/lib/utils';

export interface CreateAdminInput {
  username: string;
  password: string;
  nama: string;
}

export interface LoginInput {
  username: string;
  password: string;
}

export interface LoginResult {
  success: boolean;
  admin?: Omit<Admin, 'password'>;
  message: string;
}

/**
 * Create a new admin user
 */
export async function createAdmin(data: CreateAdminInput): Promise<Omit<Admin, 'password'>> {
  const hashedPassword = await hashPassword(data.password);

  const admin = await prisma.admin.create({
    data: {
      username: data.username,
      password: hashedPassword,
      nama: data.nama,
    },
  });

  // Remove password from return value
  const { password, ...adminWithoutPassword } = admin;
  return adminWithoutPassword;
}

/**
 * Authenticate admin login
 */
export async function loginAdmin(data: LoginInput): Promise<LoginResult> {
  const admin = await prisma.admin.findUnique({
    where: { username: data.username },
  });

  if (!admin) {
    return {
      success: false,
      message: 'Invalid username or password',
    };
  }

  const isPasswordValid = await verifyPassword(data.password, admin.password);

  if (!isPasswordValid) {
    return {
      success: false,
      message: 'Invalid username or password',
    };
  }

  const { password, ...adminWithoutPassword } = admin;

  return {
    success: true,
    admin: adminWithoutPassword,
    message: 'Login successful',
  };
}

/**
 * Get admin by ID (without password)
 */
export async function getAdminById(id: string): Promise<Omit<Admin, 'password'> | null> {
  const admin = await prisma.admin.findUnique({
    where: { id },
  });

  if (!admin) {
    return null;
  }

  const { password, ...adminWithoutPassword } = admin;
  return adminWithoutPassword;
}

/**
 * Get admin by username (without password)
 */
export async function getAdminByUsername(username: string): Promise<Omit<Admin, 'password'> | null> {
  const admin = await prisma.admin.findUnique({
    where: { username },
  });

  if (!admin) {
    return null;
  }

  const { password, ...adminWithoutPassword } = admin;
  return adminWithoutPassword;
}

/**
 * Get all admins (without passwords)
 */
export async function getAllAdmins(): Promise<Array<Omit<Admin, 'password'>>> {
  const admins = await prisma.admin.findMany({
    orderBy: { created_at: 'desc' },
  });

  return admins.map((admin) => {
    const { password, ...adminWithoutPassword } = admin;
    return adminWithoutPassword;
  });
}

/**
 * Update admin
 */
export async function updateAdmin(
  id: string,
  data: Partial<CreateAdminInput>
): Promise<Omit<Admin, 'password'>> {
  const updateData: Record<string, unknown> = { ...data };

  // Hash password if provided
  if (data.password) {
    updateData.password = await hashPassword(data.password);
  }

  const admin = await prisma.admin.update({
    where: { id },
    data: updateData,
  });

  const { password, ...adminWithoutPassword } = admin;
  return adminWithoutPassword;
}

/**
 * Delete admin
 */
export async function deleteAdmin(id: string): Promise<Omit<Admin, 'password'>> {
  const admin = await prisma.admin.delete({
    where: { id },
  });

  const { password, ...adminWithoutPassword } = admin;
  return adminWithoutPassword;
}

/**
 * Change admin password
 */
export async function changeAdminPassword(
  id: string,
  oldPassword: string,
  newPassword: string
): Promise<boolean> {
  const admin = await prisma.admin.findUnique({
    where: { id },
  });

  if (!admin) {
    return false;
  }

  const isOldPasswordValid = await verifyPassword(oldPassword, admin.password);

  if (!isOldPasswordValid) {
    return false;
  }

  const hashedNewPassword = await hashPassword(newPassword);

  await prisma.admin.update({
    where: { id },
    data: { password: hashedNewPassword },
  });

  return true;
}
