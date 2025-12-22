// Script mejorado para extraer promociones de MODO.com.ar
// Ejecutar en la consola del navegador en https://promoshub.modo.com.ar

(() => {
  console.log('🔍 Iniciando extracción de promociones...');

  // Buscar el contenedor correcto - hay múltiples secciones
  const containers = [
    document.querySelector('[data-testid="slot-vertical-container"]'),
    document.querySelector('[data-testid="slot-vertical"]'),
    ...Array.from(document.querySelectorAll('[data-testid="slot-horizontal"]'))
  ].filter(Boolean);

  if (containers.length === 0) {
    console.error('❌ No se encontró el contenedor de promociones');
    return [];
  }

  console.log(`✅ Encontrados ${containers.length} contenedor(es)`);

  // Buscar todas las tarjetas de promociones
  const cardSelectors = [
    '[data-testid="card-cardtion-MD"]',
    '[data-testid="card-cardtion-LG"]',
    'a[href*="/promos/"]'
  ];

  const allCards = [];
  containers.forEach(container => {
    cardSelectors.forEach(selector => {
      const cards = Array.from(container.querySelectorAll(selector));
      allCards.push(...cards);
    });
  });

  // Eliminar duplicados (puede haber múltiples matches)
  const uniqueCards = Array.from(new Set(allCards));

  console.log(`📦 Encontradas ${uniqueCards.length} tarjetas de promociones`);

  const promos = uniqueCards.map((card, i) => {
    try {
      // Obtener el elemento <a> padre si existe, o usar el card directamente
      const linkElement = card.closest('a') || card;
      let linkUrl = linkElement.getAttribute('href') || '';
      
      if (linkUrl && linkUrl.startsWith('/')) {
        linkUrl = 'https://promoshub.modo.com.ar' + linkUrl;
      } else if (linkUrl && !linkUrl.startsWith('http')) {
        linkUrl = 'https://promoshub.modo.com.ar/' + linkUrl;
      }

      // Título - buscar en varios lugares posibles
      const titleSelectors = [
        '.text-callout-medium',
        '[class*="text-callout"]',
        '[class*="title"]',
        'div:has(+ div [data-testid="tag-rewards-wrapper"])'
      ];

      let title = '';
      for (const selector of titleSelectors) {
        const titleEl = card.querySelector(selector);
        if (titleEl && titleEl.textContent.trim()) {
          title = titleEl.textContent.trim();
          break;
        }
      }

      // Beneficio/Reintegro - buscar en el tag-rewards-wrapper
      const benefitEl = card.querySelector('[data-testid="tag-rewards-wrapper"] span');
      const benefit = benefitEl?.textContent?.trim() || '';

      // Imagen - buscar background-image
      let imageUrl = '';
      const imageSelectors = [
        'div[style*="background-image"]',
        '[class*="primaryImage"] div[style*="background-image"]',
        'div[style*="background-image"]'
      ];

      for (const selector of imageSelectors) {
        const imgDiv = card.querySelector(selector);
        if (imgDiv) {
          const style = imgDiv.getAttribute('style') || '';
          const match = style.match(/url\(["']?(.*?)["']?\)/i);
          if (match && match[1]) {
            imageUrl = match[1].trim();
            break;
          }
        }
      }

      // Tags inferiores
      const tagElements = Array.from(
        card.querySelectorAll('[data-testid^="bottom-tag-card-promotion-"]')
      );

      const tags = tagElements.map(el => {
        const textEl = el.querySelector('div:last-child');
        return textEl?.textContent?.trim() || '';
      }).filter(Boolean);

      // Determinar tope
      const tope = tags.find(t => /con tope|sin tope/i.test(t)) || null;

      // Determinar banco
      const bancoTags = tags.filter(t => 
        /(macro|galicia|bbva|hipotecario|credicoop|comafi|supervielle|santander|bna|ciudad|buepp)/i.test(t)
      );
      const banco = bancoTags.length > 0 ? bancoTags[0] : null;

      // Extraer porcentaje o cuotas del beneficio
      const discountMatch = benefit.match(/(\d+)\s*%/i);
      const cuotasMatch = benefit.match(/(\d+)\s*(cuotas?|CSI)/i);

      // Determinar categoría
      const text = (title + ' ' + benefit).toLowerCase();
      let category = 'general';
      
      if (/super|chango|carrefour|acai|toledo|lario|jumbo|disco|vea|maxiconsumo|vital/i.test(text)) {
        category = 'food';
      } else if (/perfume|belleza|parfumerie|juleriaque|farma/i.test(text)) {
        category = 'beauty';
      } else if (/combustible|axion|ypf|shell/i.test(text)) {
        category = 'automotive';
      } else if (/indumentaria|look|stock center|get the look|fashion/i.test(text)) {
        category = 'fashion';
      } else if (/farmacia|farma/i.test(text)) {
        category = 'health';
      } else if (/shopping|tienda/i.test(text)) {
        category = 'general';
      }

      return {
        name: title || `Promoción ${i + 1}`,
        title,
        description: benefit,
        category,
        discountPercentage: discountMatch ? parseInt(discountMatch[1]) : null,
        installments: cuotasMatch ? parseInt(cuotasMatch[1]) : null,
        terms: tope || undefined,
        membershipRequired: banco ? [banco] : [],
        imageUrl,
        origin: 'MODO.com.ar',
        type: 'scraped',
        status: 'active',
        linkUrl,
        tags: tags,
      };
    } catch (error) {
      console.error(`Error procesando promoción ${i + 1}:`, error);
      return null;
    }
  }).filter(Boolean); // Eliminar nulls

  console.log('✅ Extraídas', promos.length, 'promociones');
  console.log('📋 Ejemplo de promoción:', promos[0]);
  
  // Guardar en window para acceso global
  window.promocionesModo = promos;
  
  // También copiar al portapapeles como JSON
  const json = JSON.stringify(promos, null, 2);
  navigator.clipboard.writeText(json).then(() => {
    console.log('📋 Promociones copiadas al portapapeles como JSON');
  }).catch(() => {
    console.log('⚠️ No se pudo copiar al portapapeles, pero están en window.promocionesModo');
  });

  return promos;
})();
