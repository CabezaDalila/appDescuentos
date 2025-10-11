interface Bank {
  id: string;
  name: string;
  logo: string;
}

const popularBanks: Bank[] = [
  { id: "galicia", name: "Galicia", logo: "🏦" },
  { id: "santander", name: "Santander", logo: "🏦" },
  { id: "bbva", name: "BBVA", logo: "🏦" },
  { id: "macro", name: "Macro", logo: "🏦" },
  { id: "nacion", name: "Nación", logo: "🏦" },
];

interface PopularBanksSectionProps {
  onBankClick: (bankId: string) => void;
}

export function PopularBanksSection({ onBankClick }: PopularBanksSectionProps) {
  return (
    <div className="w-full px-3 sm:px-4 mb-4 sm:mb-5">
      <div className="flex justify-between items-center mb-2 sm:mb-3">
        <h2 className="text-sm sm:text-base font-semibold text-gray-900">
          Bancos populares
        </h2>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {popularBanks.map((bank) => (
          <button
            key={bank.id}
            onClick={() => onBankClick(bank.id)}
            className="flex-shrink-0 bg-gray-100 rounded-lg sm:rounded-xl p-2 sm:p-3 min-w-[60px] sm:min-w-[70px] hover:bg-gray-200 transition-colors"
          >
            <div className="text-lg sm:text-xl mb-1 sm:mb-2">{bank.logo}</div>
            <div className="text-[10px] sm:text-xs font-medium text-gray-700 text-center leading-tight">
              {bank.name}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
