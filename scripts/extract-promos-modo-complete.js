// Script completo - extrae promociones básicas y navega a cada detalle
// Ejecutar en la consola del navegador en https://promoshub.modo.com.ar

const extractDetailData = async (url) => {
  try {
    console.log(`📄 Extrayendo detalles de: ${url}`);
    const response = await fetch(url);
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    const detail = {};
    
    // Intentar extraer del JSON de Next.js primero (más confiable)
    const nextDataScript = doc.querySelector('script#_NEXT_DATA_');
    if (nextDataScript) {
      try {
        const scriptText = nextDataScript.textContent || '';
        // El JSON puede estar en diferentes formatos en Next.js
        let nextData = {};
        
        try {
          nextData = JSON.parse(scriptText);
        } catch (e) {
          // Intentar extraer solo la parte JSON si hay código alrededor
          const jsonMatch = scriptText.match(/\{[\s\S]*"props"[\s\S]*\}/);
          if (jsonMatch) {
            nextData = JSON.parse(jsonMatch[0]);
          }
        }
        
        // Buscar datos de la promoción en diferentes ubicaciones posibles
        const promo = nextData.props?.pageProps?.promotion || 
                     nextData.props?.pageProps?.data?.promotion ||
                     nextData.props?.pageProps?.promotionData;
        
        if (promo) {
          detail.reimbursementCap = promo.reimbursementCap || promo.maxReimbursement || promo.reimbursementCapAmount;
          detail.validFrom = promo.validFrom || promo.startDate || promo.validFromDate;
          detail.validUntil = promo.validUntil || promo.endDate || promo.validUntilDate;
          detail.modality = promo.modality || promo.type || promo.paymentType;
          detail.fullDescription = promo.description || promo.fullDescription || promo.detailedDescription;
          detail.termsAndConditions = promo.termsAndConditions || promo.terms || promo.termsAndConditionsText;
          detail.banks = promo.banks || promo.bankNames || promo.bankList || [];
          detail.installmentsDetail = promo.installmentsDetail || promo.installmentsText || promo.installments;
          detail.applicableDays = promo.applicableDays || promo.days || promo.applicableDaysText;
        }
      } catch (e) {
        console.log('⚠️ No se pudo parsear _NEXT_DATA_, usando DOM');
      }
    }
    
    // Extraer del DOM usando selectores específicos
    // Tope de reintegro - buscar el span que contiene el monto
    if (!detail.reimbursementCap) {
      // Buscar el div que contiene "Tope de reintegro" como label
      const topeDivs = Array.from(doc.querySelectorAll('div')).filter(div => {
        const text = div.textContent || '';
        return text.includes('Tope de reintegro') && 
               !text.includes('Icono') &&
               !text.includes('self.__next_f');
      });
      
      for (const topeDiv of topeDivs) {
        // Buscar el span con clase text-body-medium que contiene el monto
        const span = topeDiv.querySelector('span.text-body-medium');
        if (span) {
          const topeText = span.textContent || '';
          // Buscar el patrón $40.000 o similar
          const topeMatch = topeText.match(/\$[\s]*([\d.,]+)/);
          if (topeMatch) {
            const amount = topeMatch[1].replace(/[,]/g, '').trim();
            // Validar que sea un número razonable (no código)
            if (parseInt(amount) > 0 && parseInt(amount) < 100000000) {
              detail.reimbursementCap = amount;
              break;
            }
          }
        }
      }
    }
    
    // Cuotas específicas - buscar el span con las cuotas
    if (!detail.installmentsDetail) {
      // Buscar divs que contengan "Cuotas" como label
      const cuotasDivs = Array.from(doc.querySelectorAll('div')).filter(div => {
        const text = div.textContent || '';
        return text.includes('Cuotas') && 
               !text.includes('Icono') && 
               !text.includes('self.__next_f');
      });
      
      for (const cuotasDiv of cuotasDivs) {
        // Buscar el span con clase text-body-medium que está después del label
        const span = cuotasDiv.querySelector('span.text-body-medium');
        if (span) {
          const cuotasText = span.textContent?.trim() || '';
          // Validar que sea texto legible de cuotas
          if (cuotasText && 
              cuotasText.length > 5 && 
              cuotasText.length < 200 && 
              (cuotasText.includes('cuotas') || cuotasText.includes('CSI') || cuotasText.match(/\d+/)) &&
              !cuotasText.includes('self.__next_f') &&
              !cuotasText.includes('$RB=')) {
            detail.installmentsDetail = cuotasText;
            break;
          }
        }
      }
    }
    
    // Modalidad de uso
    if (!detail.modality) {
      const modalidadDivs = Array.from(doc.querySelectorAll('div')).filter(div => {
        const text = div.textContent || '';
        return text.includes('Modalidad de uso');
      });
      
      for (const modalidadDiv of modalidadDivs) {
        const span = modalidadDiv.querySelector('span.text-body-medium');
        if (span) {
          const modalidadText = span.textContent?.trim() || '';
          if (modalidadText.includes('Presencial')) {
            detail.modality = 'presencial';
            break;
          } else if (modalidadText.includes('Online')) {
            detail.modality = 'online';
            break;
          }
        }
      }
    }
    
    // Días que aplica
    if (!detail.applicableDays) {
      const diasSpan = doc.querySelector('[data-testid="all-days"]');
      if (diasSpan) {
        detail.applicableDays = 'todos';
      } else {
        const diasDivs = Array.from(doc.querySelectorAll('div')).filter(div => {
          const text = div.textContent || '';
          return text.includes('Días que aplica');
        });
        
        for (const diasDiv of diasDivs) {
          const span = diasDiv.querySelector('span.text-body-medium');
          if (span) {
            const diasText = span.textContent?.trim() || '';
            if (diasText && diasText.length < 100) {
              detail.applicableDays = diasText;
              break;
            }
          }
        }
      }
    }
    
    // Vigencia
    if (!detail.validFrom || !detail.validUntil) {
      const vigenciaDivs = Array.from(doc.querySelectorAll('div')).filter(div => {
        const text = div.textContent || '';
        return text.includes('Vigencia') && 
               !text.includes('Icono') &&
               !text.includes('self.__next_f');
      });
      
      for (const vigenciaDiv of vigenciaDivs) {
        const span = vigenciaDiv.querySelector('span.text-body-medium');
        if (span) {
          const vigenciaText = span.textContent || '';
          // Buscar patrón "Del DD/MM/YY al DD/MM/YY"
          const vigenciaMatch = vigenciaText.match(/Del\s+(\d{2}\/\d{2}\/\d{2,4})\s+al\s+(\d{2}\/\d{2}\/\d{2,4})/i);
          if (vigenciaMatch && vigenciaMatch[1] && vigenciaMatch[2]) {
            detail.validFrom = vigenciaMatch[1];
            detail.validUntil = vigenciaMatch[2];
            break;
          }
        }
      }
    }
    
    // Bancos adheridos - buscar imágenes con alt específico
    if (!detail.banks || detail.banks.length === 0) {
      const bancos = [];
      // Buscar todas las imágenes que podrían ser de bancos
      const allImages = doc.querySelectorAll('img[alt]');
      allImages.forEach(img => {
        const alt = img.getAttribute('alt') || '';
        // Filtrar solo nombres de bancos conocidos
        if (alt && 
            !alt.includes('Icono') && 
            !alt.includes('banco') && 
            !alt.includes('visa') && 
            !alt.includes('master') &&
            !alt.includes('Crédito') &&
            !alt.includes('Débito') &&
            alt.length < 50) {
          // Verificar que sea un banco conocido
          const bancoMatch = alt.match(/(Comafi|Santander|BNA|Galicia|BBVA|Hipotecario|Credicoop|Supervielle|Macro|Ciudad|Buepp)/i);
          if (bancoMatch) {
            bancos.push(alt);
          }
        }
      });
      
      // Eliminar duplicados
      if (bancos.length > 0) {
        detail.banks = [...new Set(bancos)];
      }
    }
    
    // Descripción detallada - buscar en la sección "A TENER EN CUENTA..."
    if (!detail.fullDescription) {
      const descriptionSections = doc.querySelectorAll('[data-testid="main-description"]');
      for (const section of descriptionSections) {
        const text = section.textContent?.trim() || '';
        // Verificar que no sea código JavaScript/HTML
        if (text && 
            text.length > 20 && 
            text.length < 5000 && 
            !text.includes('self.__next_f') &&
            !text.includes('$RB=') &&
            !text.includes('document.querySelector')) {
          // Verificar que esté en la sección correcta (no en términos)
          const parent = section.closest('div');
          if (parent && parent.textContent?.includes('A TENER EN CUENTA')) {
            detail.fullDescription = text;
            break;
          }
        }
      }
    }
    
    // Términos y condiciones - buscar en el details
    if (!detail.termsAndConditions) {
      const termsSection = doc.querySelector('details');
      if (termsSection) {
        const termsContent = termsSection.querySelector('[data-testid="main-description"]');
        if (termsContent) {
          const text = termsContent.textContent?.trim() || '';
          // Verificar que no sea código
          if (text && 
              text.length > 20 && 
              !text.includes('self.__next_f') &&
              !text.includes('$RB=')) {
            detail.termsAndConditions = text;
          }
        }
      }
    }
    
    // Limpiar installmentsDetail si tiene código basura
    if (detail.installmentsDetail) {
      const text = detail.installmentsDetail;
      if (text.includes('self.__next_f') || 
          text.includes('$RB=') || 
          text.includes('document.querySelector') ||
          text.length > 200) {
        detail.installmentsDetail = null; // Limpiar si tiene basura
      }
    }
    
    return detail;
  } catch (error) {
    console.error(`❌ Error extrayendo detalles de ${url}:`, error);
    return {};
  }
};

const extractPromosComplete = async (options = {}) => {
  const { limit = null, delay = 1000 } = options;
  
  console.log('🔍 Buscando promociones...');
  
  // Buscar todas las tarjetas de promociones
  const cards = Array.from(document.querySelectorAll('a[href*="/promos/"]'));
  
  if (cards.length === 0) {
    console.error('❌ No se encontraron promociones. Asegúrate de estar en la página correcta.');
    return [];
  }
  
  const totalCards = limit ? Math.min(cards.length, limit) : cards.length;
  console.log(`📦 Encontradas ${cards.length} promociones${limit ? ` (procesando ${totalCards})` : ''}`);
  
  // Primero extraer datos básicos
  const promosBasic = cards.map((card, i) => {
    // Link
    let linkUrl = card.getAttribute('href') || '';
    if (linkUrl.startsWith('/')) {
      linkUrl = 'https://promoshub.modo.com.ar' + linkUrl;
    }
    
    // Título
    const titleEl = card.querySelector('.text-callout-medium');
    const title = titleEl?.textContent?.trim() || '';
    
    // Beneficio
    const benefitEl = card.querySelector('[data-testid="tag-rewards-wrapper"] span');
    const benefit = benefitEl?.textContent?.trim() || '';
    
    // Imagen
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
  
  console.log('✅ Extraídas', promosBasic.length, 'promociones básicas');
  console.log('🔄 Extrayendo detalles de cada promoción...');
  
  // Limitar si se especificó
  const promosToProcess = limit ? promosBasic.slice(0, limit) : promosBasic;
  
  // Ahora extraer detalles de cada promoción
  const promosComplete = [];
  for (let i = 0; i < promosToProcess.length; i++) {
    const promo = promosToProcess[i];
    const progress = `[${i + 1}/${promosToProcess.length}]`;
    console.log(`${progress} Procesando: ${promo.title || 'Sin título'}`);
    
    const detailData = await extractDetailData(promo.linkUrl);
    
    // Limpiar y validar datos antes de combinar
    const cleanInstallmentsDetail = detailData.installmentsDetail && 
      detailData.installmentsDetail.length < 200 && 
      !detailData.installmentsDetail.includes('self.__next_f') ?
      detailData.installmentsDetail : null;
    
    const cleanFullDescription = detailData.fullDescription && 
      detailData.fullDescription.length < 5000 &&
      !detailData.fullDescription.includes('self.__next_f') ?
      detailData.fullDescription : null;
    
    const cleanTerms = detailData.termsAndConditions && 
      detailData.termsAndConditions.length < 10000 &&
      !detailData.termsAndConditions.includes('self.__next_f') ?
      detailData.termsAndConditions : null;
    
    // Combinar datos básicos con detalles
    const promoComplete = {
      ...promo,
      // Detalles adicionales (solo si son válidos)
      reimbursementCap: detailData.reimbursementCap || null,
      reimbursementCapAmount: detailData.reimbursementCap ? 
        parseFloat(detailData.reimbursementCap.replace(/[,]/g, '')) : null,
      installmentsDetail: cleanInstallmentsDetail,
      modality: detailData.modality || null,
      applicableDays: detailData.applicableDays || null,
      validFrom: detailData.validFrom || null,
      validUntil: detailData.validUntil || null,
      fullDescription: cleanFullDescription,
      termsAndConditions: cleanTerms,
      // Actualizar campos si hay información más precisa en el detalle
      installments: cleanInstallmentsDetail ? 
        (cleanInstallmentsDetail.match(/\d+/g) || []).map(Number)[0] || promo.installments : 
        promo.installments,
      membershipRequired: detailData.banks && detailData.banks.length > 0 ? 
        detailData.banks : 
        (promo.membershipRequired && promo.membershipRequired.length > 0 ? promo.membershipRequired : []),
      banks: detailData.banks && detailData.banks.length > 0 ? 
        detailData.banks : 
        (promo.membershipRequired && promo.membershipRequired.length > 0 ? promo.membershipRequired : []),
    };
    
    // Eliminar campos null/undefined para limpiar el JSON
    Object.keys(promoComplete).forEach(key => {
      if (promoComplete[key] === null || promoComplete[key] === undefined || promoComplete[key] === '') {
        delete promoComplete[key];
      }
    });
    
    promosComplete.push(promoComplete);
    console.log(`${progress} ✅ Completado`);
    
    // Pausa para no sobrecargar el servidor
    if (i < promosToProcess.length - 1) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  console.log('✅ Extracción completa!', promosComplete.length, 'promociones con detalles');
  console.table(promosComplete.slice(0, 3)); // Mostrar primeras 3 en tabla
  
  window.promocionesModo = promosComplete;
  
  // Copiar al portapapeles como JSON
  const json = JSON.stringify(promosComplete, null, 2);
  navigator.clipboard.writeText(json).then(() => {
    console.log('📋 Promociones completas copiadas al portapapeles como JSON');
  }).catch(() => {
    console.log('⚠️ No se pudo copiar al portapapeles, pero están en window.promocionesModo');
  });
  
  return promosComplete;
};

// Ejecutar
// Para procesar solo las primeras 5 promociones (útil para pruebas):
// extractPromosComplete({ limit: 5, delay: 500 });

// Para procesar todas las promociones:
extractPromosComplete();
