/* Layout Component - A component that wraps the main content of the app
   - Use this file to add a header, footer, or other elements that should be present on every page
   - This component is used in the App.tsx file to wrap the main content of the app */

import { Outlet } from 'react-router-dom'
import { Info } from 'lucide-react'
import { PrismaLogo } from './PrismaLogo'

export default function Layout() {
  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7F6] text-[#1A2B3C] font-sans antialiased selection:bg-[#4E7A54] selection:text-white">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-[#0B2A4A] text-white shadow-md border-b border-[#081E36]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          {/* Brand Left */}
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-[#081E36]/80 border border-[#4E7A54]/40 flex items-center justify-center shrink-0">
              <PrismaLogo className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-base sm:text-xl text-white tracking-tight leading-snug">
                Prisma Consulta Tributária
              </span>
              <span className="text-xs sm:text-sm text-[#8A98A6] font-normal hidden xs:inline-block sm:block">
                Consultoria tributária com IA para contadores e advogados
              </span>
            </div>
          </div>

          {/* Badge Right */}
          <div className="shrink-0">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#4E7A54] text-[#EEF4EE] text-xs font-medium bg-[#4E7A54]/15">
              <Info className="w-3.5 h-3.5 text-[#4E7A54]" />
              <span className="hidden sm:inline">Modo demonstração</span>
              <span className="sm:hidden">Demo</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1200px] w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Outlet />
      </main>

      {/* Slim Dark Blue Footer */}
      <footer className="bg-[#0B2A4A] text-[#8A98A6] text-xs sm:text-sm border-t border-[#081E36] py-4 mt-auto">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <p className="font-medium text-[#C0C9D0]">
            Ferramenta de apoio à decisão tributária. Não substitui parecer técnico.
          </p>
          <p className="text-xs text-[#8A98A6]/80">
            &copy; {new Date().getFullYear()} Prisma Consulta Tributária. Todos os direitos
            reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}
