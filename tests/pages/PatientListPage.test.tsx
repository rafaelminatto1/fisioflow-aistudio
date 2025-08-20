// tests/pages/PatientListPage.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { vi, describe, it, expect, beforeEach, type Mock } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import PatientListPage from '../../pages/PatientListPage';
import { usePatients } from '../../hooks/usePatients';
import { PatientSummary } from '../../types';

// Mock the custom hook
vi.mock('../../hooks/usePatients');

// Mock child components to isolate the test
vi.mock('../../components/PageHeader', () => ({
  default: ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));

vi.mock('../../components/PatientFormModal', () => ({
  default: ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) =>
    isOpen ? (
      <div data-testid="patient-form-modal">
        Modal Aberto <button onClick={onClose}>Fechar</button>
      </div>
    ) : null,
}));

// Mock the Toast context
vi.mock('../../contexts/ToastContext', () => ({
  useToast: () => ({
    showToast: vi.fn(),
  }),
}));

// Mock debounce to make it immediate for tests
vi.mock('../../hooks/useDebounce', () => ({
  useDebounce: (value: any) => value,
}));


const mockUsePatients = usePatients as Mock;
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
    const original = await vi.importActual('react-router-dom');
    return {
        ...original,
        useNavigate: () => mockNavigate,
    };
});


describe('PatientListPage', () => {
    const mockFetchInitial = vi.fn();
    const mockFetchMore = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock implementation for usePatients
    mockUsePatients.mockReturnValue({
        patients: [],
        isLoading: true,
        isLoadingMore: false,
        hasMore: false,
        error: null,
        fetchInitialPatients: mockFetchInitial,
        fetchMorePatients: mockFetchMore,
        addPatient: vi.fn(),
    });
  });

  const renderComponent = () => {
    render(
      <MemoryRouter>
        <PatientListPage />
      </MemoryRouter>
    );
  };

  it('deve chamar fetchInitialPatients na montagem', () => {
    renderComponent();
    expect(mockFetchInitial).toHaveBeenCalledWith({ searchTerm: '', statusFilter: 'All' });
  });

  it('deve renderizar o estado de carregamento corretamente', () => {
    renderComponent();
    // Skeleton renders 10 rows
    const rows = screen.getAllByRole('row');
    expect(rows).toHaveLength(11); // 1 header + 10 skeleton rows
  });

  it('deve renderizar o estado de erro corretamente', () => {
    mockUsePatients.mockReturnValue({ ...mockUsePatients(), isLoading: false, error: new Error('Falha na API') });
    renderComponent();
    expect(screen.getByText(/Falha ao carregar pacientes/i)).toBeInTheDocument();
  });

  it('deve renderizar a lista de pacientes quando os dados são carregados', () => {
    const mockData: PatientSummary[] = [
      { id: '1', name: 'Ana Beatriz Costa', email: 'ana@email.com', phone: '123', status: 'Active', lastVisit: new Date().toISOString(), avatarUrl: '' },
      { id: '2', name: 'Bruno Gomes', email: 'bruno@email.com', phone: '456', status: 'Inactive', lastVisit: new Date().toISOString(), avatarUrl: '' },
    ];
    mockUsePatients.mockReturnValue({ ...mockUsePatients(), patients: mockData, isLoading: false });
    
    renderComponent();
    expect(screen.getByText('Ana Beatriz Costa')).toBeInTheDocument();
    expect(screen.getByText('Bruno Gomes')).toBeInTheDocument();
  });

   it('deve chamar fetchInitialPatients ao alterar o filtro de busca', async () => {
        renderComponent();
        const searchInput = screen.getByPlaceholderText(/Buscar por nome ou CPF/i);
        fireEvent.change(searchInput, { target: { value: 'test' } });
        
        await waitFor(() => {
            expect(mockFetchInitial).toHaveBeenCalledWith({ searchTerm: 'test', statusFilter: 'All' });
        });
   });

   it('deve chamar fetchMorePatients ao clicar no botão "Carregar Mais"', () => {
       mockUsePatients.mockReturnValue({ ...mockUsePatients(), isLoading: false, hasMore: true });
       renderComponent();
       
       const loadMoreButton = screen.getByRole('button', { name: /Carregar Mais/i });
       fireEvent.click(loadMoreButton);

       expect(mockFetchMore).toHaveBeenCalled();
   });
});