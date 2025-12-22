// Versión simplificada - copiar y pegar directamente en la consola del navegador
// en https://promoshub.modo.com.ar

const extractPromos = () => {
  console.log('🔍 Buscando promociones...');
  
  // Buscar todas las tarjetas de promociones
  const cards = Array.from(document.querySelectorAll('a[href*="/promos/"]'));
  
  if (cards.length === 0) {
    console.error('❌ No se encontraron promociones. Asegúrate de estar en la página correcta.');
    return [];
  }
  
  console.log(`📦 Encontradas ${cards.length} promociones`);
  
  const promos = cards.map((card, i) => {
    // Link
    let linkUrl = card.getAttribute('href') || '';
    if (linkUrl.startsWith('/')) {
      linkUrl = 'https://promoshub.modo.com.ar' + linkUrl;
    }
    
    // Título - buscar el texto en el div con clase text-callout-medium
    const titleEl = card.querySelector('.text-callout-medium');
    const title = titleEl?.textContent?.trim() || '';
    
    // Beneficio - buscar en tag-rewards-wrapper
    const benefitEl = card.querySelector('[data-testid="tag-rewards-wrapper"] span');
    const benefit = benefitEl?.textContent?.trim() || '';
    
    // Imagen - buscar div con background-image
    let imageUrl = '';
    const imgDiv = card.querySelector('div[style*="background-image"]');
    if (imgDiv) {
      const style = imgDiv.getAttribute('style') || '';
      const match = style.match(/url\(["']?(.*?)["']?\)/i);
      imageUrl = match?.[1]?.trim() || '';
    }
    
    // Tags
    const tagElements = Array.from(
      card.querySelectorAll('[data-testid^="bottom-tag-card-promotion-"]')
    );
    const tags = tagElements.map(el => {
      const textDiv = el.querySelector('div:last-child');
      return textDiv?.textContent?.trim() || '';
    }).filter(Boolean);
    
    // Tope
    const tope = tags.find(t => /con tope|sin tope/i.test(t)) || null;
    
    // Banco
    const banco = tags.find(t => 
      /(macro|galicia|bbva|hipotecario|credicoop|comafi|supervielle|santander|bna|ciudad|buepp)/i.test(t)
    ) || null;
    
    // Porcentaje o cuotas
    const discountMatch = benefit.match(/(\d+)\s*%/i);
    const cuotasMatch = benefit.match(/(\d+)\s*(cuotas?|CSI)/i);
    
    // Categoría básica
    const text = (title + ' ' + benefit).toLowerCase();
    let category = 'general';
    if (/super|chango|jumbo|disco|vea|maxiconsumo|vital/i.test(text)) category = 'food';
    else if (/farma|perfume|belleza/i.test(text)) category = 'beauty';
    else if (/combustible|ypf|shell/i.test(text)) category = 'automotive';
    else if (/indumentaria|look|fashion/i.test(text)) category = 'fashion';
    
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
    };
  });
  
  console.log('✅ Extraídas', promos.length, 'promociones');
  console.table(promos.slice(0, 5)); // Mostrar primeras 5 en tabla
  
  window.promocionesModo = promos;
  return promos;
};

// Ejecutar
extractPromos();
