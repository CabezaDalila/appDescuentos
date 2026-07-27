import { EXPLORE_CATEGORIES } from "@/constants/categories";
import type { Dispatch, RefObject, SetStateAction, TouchEvent } from "react";

interface SearchFiltersModalProps {
  dragY: number;
  modalRef: RefObject<HTMLDivElement | null>;
  contentRef: RefObject<HTMLDivElement | null>;
  draftCategories: string[];
  setDraftCategories: Dispatch<SetStateAction<string[]>>;
  draftNearby: boolean;
  setDraftNearby: Dispatch<SetStateAction<boolean>>;
  onClose: () => void;
  onTouchStart: (e: TouchEvent) => void;
  onTouchMove: (e: TouchEvent) => void;
  onTouchEnd: () => void;
}

const optionLabelClass = (active: boolean) =>
  `flex items-center gap-2 sm:gap-2.5 p-3 sm:p-3.5 rounded-lg cursor-pointer transition-all ${
    active
      ? "bg-purple-50 border-2 border-purple-300 shadow-sm"
      : "bg-gray-50 border border-gray-200 hover:bg-gray-100 hover:border-gray-300 active:scale-95"
  }`;

const optionTextClass = (active: boolean) =>
  `text-sm sm:text-base ${
    active ? "text-purple-700 font-semibold" : "text-gray-700"
  }`;

const checkboxClass =
  "w-4 h-4 sm:w-5 sm:h-5 text-purple-600 border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:ring-offset-0 flex-shrink-0";

/**
 * Bottom-sheet de filtros del buscador (categorías, favoritos, cercanía).
 * El estado de "draft" y el gesto de arrastre viven en la página; este
 * componente es presentacional.
 */
export function SearchFiltersModal({
  dragY,
  modalRef,
  contentRef,
  draftCategories,
  setDraftCategories,
  draftNearby,
  setDraftNearby,
  onClose,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
}: SearchFiltersModalProps) {
  const toggleCategory = (id: string, checked: boolean) =>
    setDraftCategories((prev) =>
      checked
        ? Array.from(new Set([...prev, id]))
        : prev.filter((categoryId) => categoryId !== id)
    );

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fade-in transition-opacity duration-200"
        style={{ opacity: dragY > 0 ? 0.6 - dragY / 500 : undefined }}
        onClick={onClose}
      />
      <div
        ref={modalRef}
        className="fixed bottom-0 left-0 right-0 z-40 bg-white rounded-t-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[75vh] md:max-h-[80vh] lg:bottom-auto lg:top-1/2 lg:left-1/2 lg:right-auto lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-2xl lg:max-w-3xl lg:w-full lg:max-h-[90vh] xl:max-w-4xl transition-transform duration-200 ease-out"
        style={{
          transform: dragY > 0 ? `translateY(${dragY}px)` : undefined,
          opacity: dragY > 0 ? 1 - dragY / 300 : undefined,
        }}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="flex justify-center pt-2 pb-1.5 sm:pt-3 sm:pb-2 md:pt-4 md:pb-3 lg:hidden cursor-grab active:cursor-grabbing"
          onTouchStart={onTouchStart}
        >
          <div className="w-12 h-1.5 sm:w-14 sm:h-1.5 bg-gray-300 rounded-full" />
        </div>

        <div
          ref={contentRef}
          className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 pb-24 lg:pb-6"
          style={{ touchAction: dragY > 0 ? "none" : "pan-y" }}
        >
          <div className="pt-4 pb-2">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 sm:mb-5 lg:mb-6">
              Filtros
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {EXPLORE_CATEGORIES.map((categoryDef) => {
                const active = draftCategories.includes(categoryDef.id);
                return (
                  <label key={categoryDef.id} className={optionLabelClass(active)}>
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={(e) =>
                        toggleCategory(categoryDef.id, e.target.checked)
                      }
                      className={checkboxClass}
                    />
                    <span className={optionTextClass(active)}>
                      {categoryDef.label}
                    </span>
                  </label>
                );
              })}
              <label className={optionLabelClass(draftCategories.includes("favoritos"))}>
                <input
                  type="checkbox"
                  checked={draftCategories.includes("favoritos")}
                  onChange={(e) => toggleCategory("favoritos", e.target.checked)}
                  className={checkboxClass}
                />
                <span className={optionTextClass(draftCategories.includes("favoritos"))}>
                  Favoritos
                </span>
              </label>
              <label className={optionLabelClass(draftNearby)}>
                <input
                  type="checkbox"
                  checked={draftNearby}
                  onChange={(e) => setDraftNearby(e.target.checked)}
                  className={checkboxClass}
                />
                <span className={optionTextClass(draftNearby)}>Cerca de ti</span>
              </label>
            </div>
          </div>
        </div>

        <div className="bg-white border-t border-gray-100 px-4 sm:px-6 lg:px-8 py-4 hidden lg:flex justify-end gap-3">
          <button
            className="px-6 py-2.5 sm:px-8 sm:py-3 text-sm sm:text-base font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-lg transition-colors"
            onClick={() => {
              setDraftCategories([]);
              setDraftNearby(false);
            }}
          >
            Limpiar
          </button>
          <button
            className="px-6 py-2.5 sm:px-8 sm:py-3 text-sm sm:text-base font-medium text-white bg-purple-600 hover:bg-purple-700 active:bg-purple-800 rounded-lg transition-colors"
            onClick={onClose}
          >
            Aplicar
          </button>
        </div>
      </div>
    </>
  );
}
