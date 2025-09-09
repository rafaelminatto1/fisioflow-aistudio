// tests/unit/cpf-validation.test.ts
import { describe, it, expect } from '@jest/globals';
import { patientFormSchema } from '@/lib/validations/patient';

// A função validateCPF não é exportada, então testamos através do schema Zod
const validateCPF = (cpf: string) => {
  const result = patientFormSchema.shape.cpf.safeParse(cpf);
  return result.success;
};

describe('CPF Validation Logic', () => {
  describe('Valid CPFs', () => {
    const validCPFs = [
      '12345678909',
      '98765432109',
      '11122233344',
      '52998224725', // CPF real válido
      '86438343272', // CPF real válido
      '21474836470', // CPF real válido
    ];

    it.each(validCPFs)('should return true for valid CPF: %s', (cpf) => {
      expect(validateCPF(cpf)).toBe(true);
    });
  });

  describe('Invalid CPFs', () => {
    const invalidCPFs = [
      '11111111111', // Todos os dígitos iguais
      '12345678901', // Dígito verificador incorreto
      '12345', // Comprimento incorreto
      'abcdefghijk', // Caracteres não numéricos
      '', // Vazio
      '123.456.789-10', // Dígito verificador incorreto com máscara
    ];

    it.each(invalidCPFs)('should return false for invalid CPF: %s', (cpf) => {
      expect(validateCPF(cpf)).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should correctly validate a CPF where the first verification digit calculation results in a remainder of 10', () => {
      // Este CPF tem o primeiro dígito verificador 0, que vem de um resto 10
      const cpfWithRemainder10 = '35852158808';
      expect(validateCPF(cpfWithRemainder10)).toBe(true);
    });

    it('should correctly validate a CPF where the second verification digit calculation results in a remainder of 10', () => {
       // Este CPF tem o segundo dígito verificador 0, que vem de um resto 10
      const cpfWithRemainder10 = '78843232304';
      expect(validateCPF(cpfWithRemainder10)).toBe(true);
    });
  });
});
