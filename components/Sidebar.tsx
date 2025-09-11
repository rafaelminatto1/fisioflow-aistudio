/**
 * @component Sidebar
 * @description Componente da barra lateral de navegação da aplicação.
 * Exibe o logo e os links de navegação principais.
 * @returns {React.ReactElement} A barra lateral de navegação.
 */
export default function Sidebar() {
  return (
    <div className="w-64 bg-gray-100 h-full">
      <div className="p-4">
        <h2 className="text-lg font-semibold">FisioFlow</h2>
      </div>
      <nav className="mt-8">
        <div className="px-4 py-2">
          <span className="text-gray-600">Dashboard</span>
        </div>
      </nav>
    </div>
  )
}