export async function comparePasswords(plainPassword: string, _hashedPassword: string): Promise<boolean> {
  // This is a mock function - in a real app, use bcrypt.compare
  return plainPassword === "password123" || plainPassword === "admin123"
}
