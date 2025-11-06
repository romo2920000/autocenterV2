import { Injectable } from '@angular/core';
import { Order } from '../models/order.model';
import { Customer } from '../models/customer.model';
import { DiagnosticItem } from '../models/diagnostic.model';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { LOGO_AUTOCENTER, LOGO_SEARS } from '../config/logos';

@Injectable({
  providedIn: 'root'
})
export class PdfGeneratorService {
  private readonly logoAutoCenter: string = LOGO_AUTOCENTER;
  private readonly logoSears: string = LOGO_SEARS;

  constructor() {
    console.log('PdfGeneratorService inicializado con logos embebidos');
    console.log('Logo AutoCenter tamaño:', this.logoAutoCenter.length);
    console.log('Logo Sears tamaño:', this.logoSears.length);
  }

  public async ensureLogosLoaded(): Promise<void> {
    // Los logos ya están cargados como constantes
    return Promise.resolve();
  }

  generateDiagnosticBudgetHTML(order: Order, customer: Customer): string {
    console.log('Generando HTML con logos');
    console.log('Logo AutoCenter disponible:', !!this.logoAutoCenter, 'Tamaño:', this.logoAutoCenter.length);
    console.log('Logo Sears disponible:', !!this.logoSears, 'Tamaño:', this.logoSears.length);

    const today = new Date().toLocaleDateString('es-MX');
    const diagnostic = order.diagnostic;
    const vehicleInfo = diagnostic?.vehicleInfo || {};

    // Determinar si el presupuesto está autorizado
    const isAuthorized = order.estado === 'Autorizado';

    // Separar refacciones autorizadas de recomendadas
    let productosAutorizadosRows = '';
    let productosRecomendadosRows = '';
    if (order.productos && order.productos.length > 0) {
      let autorizadosIdx = 1;
      let recomendadosIdx = 1;

      order.productos.forEach((producto) => {
        // Filtrar refacciones rechazadas - no mostrarlas en el presupuesto
        if (producto.isRejected) {
          return; // Skip refacciones rechazadas
        }

        let badge = '';
        let isRecommended = false;
        let isPartAuthorized = false;

        // Si la refacción es del diagnóstico, verificar si fue autorizada por el cliente
        if (producto.fromDiagnostic && producto.diagnosticSeverity) {
          // Usar directamente el campo isAuthorized del producto
          if (producto.isAuthorized) {
            // La refacción fue AUTORIZADA por el cliente
            isPartAuthorized = true;
            badge = `<span style="color: #16a34a; font-weight: bold; font-size: 9px; display: inline-block; background: #dcfce7; padding: 2px 6px; border-radius: 3px; margin-bottom: 2px; border: 1px solid #22c55e;">✓ AUTORIZADA</span><br>`;
          } else {
            // La refacción sigue como RECOMENDADA (pendiente de autorización)
            isRecommended = true;
            const severityEmoji = producto.diagnosticSeverity === 'urgent' ? '🔴' :
                                 producto.diagnosticSeverity === 'recommended' ? '🟡' :
                                 '🟢';
            const severityColor = producto.diagnosticSeverity === 'urgent' ? '#dc2626' :
                                 producto.diagnosticSeverity === 'recommended' ? '#f59e0b' :
                                 '#10b981';
            badge = `<span style="color: ${severityColor}; font-weight: bold; font-size: 9px; display: inline-block; background: ${severityColor}22; padding: 2px 6px; border-radius: 3px; margin-bottom: 2px; border: 1px solid ${severityColor};">${severityEmoji} RECOMENDADO</span><br>`;
          }
        } else {
          // Refacción pre-autorizada o autorizada manual (SÍ incluir en total)
          const statusText = isAuthorized ? 'AUTORIZADA' : 'PRE-AUTORIZADA';
          badge = `<span style="color: #1e40af; font-weight: bold; font-size: 9px; display: inline-block; background: #dbeafe; padding: 2px 6px; border-radius: 3px; margin-bottom: 2px; border: 1px solid #3b82f6;">🔵 ${statusText}</span><br>`;
        }

        if (isRecommended) {
          // Agregar a refacciones recomendadas
          productosRecomendadosRows += `
            <tr>
              <td style="border: 1px solid #ddd; padding: 4px; text-align: center; font-size: 10px;">${recomendadosIdx}</td>
              <td style="border: 1px solid #ddd; padding: 4px; font-size: 10px;">${badge}${producto.descripcion}</td>
              <td style="border: 1px solid #ddd; padding: 4px; text-align: center; font-size: 10px;">${producto.cantidad}</td>
              <td style="border: 1px solid #ddd; padding: 4px; text-align: right; font-size: 10px;">$${producto.precio.toFixed(2)}</td>
              <td style="border: 1px solid #ddd; padding: 4px; text-align: right; font-size: 10px;">$${(producto.precio * producto.cantidad).toFixed(2)}</td>
            </tr>
          `;
          recomendadosIdx++;
        } else {
          // Agregar a refacciones autorizadas
          productosAutorizadosRows += `
            <tr>
              <td style="border: 1px solid #ddd; padding: 4px; text-align: center; font-size: 10px;">${autorizadosIdx}</td>
              <td style="border: 1px solid #ddd; padding: 4px; font-size: 10px;">${badge}${producto.descripcion}</td>
              <td style="border: 1px solid #ddd; padding: 4px; text-align: center; font-size: 10px;">${producto.cantidad}</td>
              <td style="border: 1px solid #ddd; padding: 4px; text-align: right; font-size: 10px;">$${producto.precio.toFixed(2)}</td>
              <td style="border: 1px solid #ddd; padding: 4px; text-align: right; font-size: 10px;">$${(producto.precio * producto.cantidad).toFixed(2)}</td>
            </tr>
          `;
          autorizadosIdx++;
        }
      });
    }

    let serviciosRows = '';
    if (order.servicios && order.servicios.length > 0) {
      order.servicios.forEach((servicio, idx) => {
        // Filtrar servicios rechazados
        if (servicio.isRejected) {
          return;
        }

        let badge = '';
        if (servicio.fromDiagnostic && servicio.diagnosticSeverity) {
          // Verificar si fue autorizado usando el campo isAuthorized
          if (servicio.isAuthorized) {
            // Servicio autorizado del diagnóstico
            badge = `<span style="color: #16a34a; font-weight: bold; font-size: 9px; display: inline-block; background: #dcfce7; padding: 2px 6px; border-radius: 3px; margin-bottom: 2px; border: 1px solid #22c55e;">✓ AUTORIZADA</span><br>`;
          } else {
            // Badge para servicios del diagnóstico pendientes con semáforo
            const severityEmoji = servicio.diagnosticSeverity === 'urgent' ? '🔴' :
                                 servicio.diagnosticSeverity === 'recommended' ? '🟡' :
                                 '🟢';
            const severityColor = servicio.diagnosticSeverity === 'urgent' ? '#dc2626' :
                                 servicio.diagnosticSeverity === 'recommended' ? '#f59e0b' :
                                 '#10b981';
            badge = `<span style="color: ${severityColor}; font-weight: bold; font-size: 9px; display: inline-block; background: ${severityColor}22; padding: 2px 6px; border-radius: 3px; margin-bottom: 2px; border: 1px solid ${severityColor};">${severityEmoji} RECOMENDADO</span><br>`;
          }
        } else {
          // Badge para servicios pre-autorizados o autorizados (manuales)
          const statusText = isAuthorized ? 'AUTORIZADA' : 'PRE-AUTORIZADA';
          badge = `<span style="color: #1e40af; font-weight: bold; font-size: 9px; display: inline-block; background: #dbeafe; padding: 2px 6px; border-radius: 3px; margin-bottom: 2px; border: 1px solid #3b82f6;">🔵 ${statusText}</span><br>`;
        }

        serviciosRows += `
          <tr>
            <td style="border: 1px solid #ddd; padding: 4px; text-align: center; font-size: 10px;">${idx + 1}</td>
            <td style="border: 1px solid #ddd; padding: 4px; font-size: 10px;">
              ${badge}<strong>${servicio.nombre}</strong><br>
              <span style="font-size: 9px;">${servicio.descripcion}</span>
            </td>
            <td style="border: 1px solid #ddd; padding: 4px; text-align: center; font-size: 10px;">1</td>
            <td style="border: 1px solid #ddd; padding: 4px; text-align: right; font-size: 10px;">$${servicio.precio.toFixed(2)}</td>
            <td style="border: 1px solid #ddd; padding: 4px; text-align: right; font-size: 10px;">$${servicio.precio.toFixed(2)}</td>
          </tr>
        `;
      });
    }

    // Separar autorizaciones autorizadas de las pendientes/rechazadas
    let authorizedAuthsRows = '';
    let pendingAuthsRows = '';
    if (order.diagnostic_authorizations && order.diagnostic_authorizations.length > 0) {
      // El índice de autorizados empieza después de los servicios pre-autorizados
      let authorizedIdx = (order.servicios?.length || 0) + 1;
      let pendingIdx = 1;

      order.diagnostic_authorizations.forEach((auth) => {
        // FILTRAR REFACCIONES - Las refacciones ya se muestran en la sección "Refacciones Autorizadas"
        // Solo mostrar servicios/mano de obra aquí
        if (auth.category === 'part') {
          return; // Skip refacciones, ya están en "Refacciones Autorizadas"
        }

        // Si el presupuesto está autorizado, solo mostrar items autorizados
        // Si está pre-autorizado, mostrar autorizados y pendientes (no rechazados)
        if (isAuthorized && !auth.is_authorized) {
          return; // En presupuestos autorizados, skip items no autorizados
        }

        // Filtrar hallazgos rechazados - is_authorized === false significa rechazado
        if (!isAuthorized && auth.is_authorized === false) {
          return; // Skip hallazgos rechazados en pre-autorizados
        }

        const severityEmoji = auth.severity === 'urgent' ? '🔴' :
                             auth.severity === 'recommended' ? '🟡' :
                             '🟢';
        const severityLabel = auth.severity === 'urgent' ? 'URGENTE' :
                             auth.severity === 'recommended' ? 'RECOMENDADO' :
                             'BIEN';
        const severityColor = auth.severity === 'urgent' ? '#dc2626' :
                             auth.severity === 'recommended' ? '#f59e0b' :
                             '#10b981';

        if (auth.is_authorized) {
          // Formato de mano de obra para autorizados (con cantidad, precio, importe)
          // Badge AUTORIZADA en azul
          const badge = `<span style="color: #1e40af; font-weight: bold; font-size: 9px; display: inline-block; background: #dbeafe; padding: 2px 6px; border-radius: 3px; margin-bottom: 2px; border: 1px solid #3b82f6;">🔵 AUTORIZADA</span><br>`;

          authorizedAuthsRows += `
            <tr>
              <td style="border: 1px solid #ddd; padding: 4px; text-align: center; font-size: 10px;">${authorizedIdx}</td>
              <td style="border: 1px solid #ddd; padding: 4px; font-size: 10px;">
                ${badge}<strong>${auth.item_name}</strong><br>
                <span style="font-size: 9px;">${auth.description}</span>
              </td>
              <td style="border: 1px solid #ddd; padding: 4px; text-align: center; font-size: 10px;">1</td>
              <td style="border: 1px solid #ddd; padding: 4px; text-align: right; font-size: 10px;">$${(auth.estimated_cost || 0).toFixed(2)}</td>
              <td style="border: 1px solid #ddd; padding: 4px; text-align: right; font-size: 10px;">$${(auth.estimated_cost || 0).toFixed(2)}</td>
            </tr>
          `;
          authorizedIdx++;
        } else if (auth.is_authorized === null || auth.is_authorized === false) {
          // Formato de servicios sugeridos para pendientes (sin cantidad)
          pendingAuthsRows += `
            <tr>
              <td style="border: 1px solid #ddd; padding: 4px; text-align: center; font-size: 10px;">${pendingIdx}</td>
              <td style="border: 1px solid #ddd; padding: 4px; font-size: 10px;">
                <span style="color: ${severityColor}; font-weight: bold; font-size: 9px; display: inline-block; background: ${severityColor}22; padding: 2px 6px; border-radius: 3px; margin-bottom: 2px; border: 1px solid ${severityColor};">${severityEmoji} ${severityLabel}</span><br>
                <strong>${auth.item_name}</strong> (${auth.category})<br>
                <span style="font-size: 9px;">${auth.description}</span>
              </td>
              <td style="border: 1px solid #ddd; padding: 4px; text-align: right; font-size: 10px;">$${(auth.estimated_cost || 0).toFixed(2)}</td>
            </tr>
          `;
          pendingIdx++;
        }
      });
    }

    // Mostrar items del diagnostic que NO han sido enviados a autorización todavía
    let diagnosticoRows = '';
    if (diagnostic?.items && diagnostic.items.length > 0) {
      // Obtener IDs de items que ya fueron enviados a autorización
      const authorizedItemIds = new Set(
        order.diagnostic_authorizations?.map(auth => auth.diagnostic_item_id) || []
      );

      // Calcular cuántos items pendientes ya hay en pendingAuthsRows
      const pendingAuthsCount = order.diagnostic_authorizations
        ?.filter(auth => auth.is_authorized === null || auth.is_authorized === false).length || 0;
      let itemIdx = pendingAuthsCount + 1;

      diagnostic.items.forEach((item) => {
        // Solo mostrar si NO ha sido enviado a autorización Y NO está rechazado
        if (!authorizedItemIds.has(item.id || '') && !item.isRejected) {
          const severityEmoji = item.severity === 'urgent' ? '🔴' :
                               item.severity === 'recommended' ? '🟡' :
                               '🟢';
          const severityLabel = item.severity === 'urgent' ? 'URGENTE' :
                               item.severity === 'recommended' ? 'RECOMENDADO' :
                               'BIEN';
          const severityColor = item.severity === 'urgent' ? '#dc2626' :
                               item.severity === 'recommended' ? '#f59e0b' :
                               '#10b981';

          diagnosticoRows += `
            <tr>
              <td style="border: 1px solid #ddd; padding: 4px; text-align: center; font-size: 10px;">${itemIdx}</td>
              <td style="border: 1px solid #ddd; padding: 4px; font-size: 10px;">
                <span style="color: ${severityColor}; font-weight: bold; font-size: 9px; display: inline-block; background: ${severityColor}22; padding: 2px 6px; border-radius: 3px; margin-bottom: 2px; border: 1px solid ${severityColor};">${severityEmoji} ${severityLabel}</span><br>
                <strong>${item.item}</strong> (${item.category})<br>
                <span style="font-size: 9px;">${item.description}</span>
              </td>
              <td style="border: 1px solid #ddd; padding: 4px; text-align: right; font-size: 10px;">$${(item.estimatedCost || 0).toFixed(2)}</td>
            </tr>
          `;
          itemIdx++;
        }
      });
    }

    // Calcular subtotal solo de refacciones autorizadas (incluye pre-autorizadas y autorizadas del diagnóstico)
    const subtotalProductos = order.productos
      ?.filter(p => {
        if (p.isRejected) return false; // Excluir rechazadas
        // Incluir: 1) pre-autorizadas (sin fromDiagnostic) 2) del diagnóstico que fueron autorizadas
        return !p.fromDiagnostic || (p.fromDiagnostic && p.isAuthorized);
      })
      .reduce((sum, p) => sum + (p.precio * p.cantidad), 0) || 0;

    // Calcular subtotal de refacciones recomendadas (solo las pendientes, NO rechazadas)
    const subtotalProductosRecomendados = order.productos
      ?.filter(p => !p.isRejected && p.fromDiagnostic && p.diagnosticSeverity && !p.isAuthorized)
      .reduce((sum, p) => sum + (p.precio * p.cantidad), 0) || 0;

    // Calcular subtotal de servicios autorizados (incluye pre-autorizados y autorizados del diagnóstico)
    const subtotalServicios = order.servicios
      ?.filter(s => {
        if (s.isRejected) return false; // Excluir rechazados
        // Incluir: 1) pre-autorizados (sin fromDiagnostic) 2) del diagnóstico que fueron autorizados
        return !s.fromDiagnostic || (s.fromDiagnostic && s.isAuthorized);
      })
      .reduce((sum, s) => sum + s.precio, 0) || 0;

    // Calcular subtotal de autorizaciones autorizadas
    const subtotalAuthorizedAuths = order.diagnostic_authorizations
      ?.filter(auth => auth.is_authorized)
      .reduce((sum, auth) => sum + (auth.estimated_cost || 0), 0) || 0;

    // Calcular subtotal de servicios sugeridos (solo pendientes null, NO rechazados false)
    const subtotalPendingAuths = order.diagnostic_authorizations
      ?.filter(auth => auth.is_authorized === null)
      .reduce((sum, auth) => sum + (auth.estimated_cost || 0), 0) || 0;

    // Calcular subtotal de items del diagnostic que NO han sido enviados a autorización Y NO están rechazados
    const authorizedItemIds = new Set(
      order.diagnostic_authorizations?.map(auth => auth.diagnostic_item_id) || []
    );
    const subtotalDiagnostico = diagnostic?.items
      ?.filter(item => !authorizedItemIds.has(item.id || '') && !item.isRejected)
      .reduce((sum, item) => sum + (item.estimatedCost || 0), 0) || 0;

    const total = subtotalProductos + subtotalServicios + subtotalAuthorizedAuths;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Presupuesto - ${order.folio}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: Arial, sans-serif;
            padding: 15px;
            background: white;
            font-size: 11px;
          }
          .header {
            background: white;
            color: #333;
            padding: 12px;
            text-align: center;
            margin-bottom: 10px;
            border-bottom: 2px solid #e5e7eb;
          }
          .header h1 {
            margin: 0;
            font-size: 22px;
            letter-spacing: 2px;
          }
          .header h2 {
            margin: 3px 0 0 0;
            font-size: 12px;
            font-weight: normal;
            opacity: 0.9;
          }
          .folio-date {
            text-align: right;
            margin-bottom: 8px;
            font-size: 10px;
            color: #666;
          }
          .info-section {
            background: #f3f4f6;
            padding: 8px;
            margin-bottom: 8px;
            border-radius: 4px;
            border-left: 3px solid #3b82f6;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 4px;
          }
          .info-item {
            font-size: 10px;
            padding: 2px 0;
          }
          .info-label {
            font-weight: bold;
            color: #1e40af;
            display: inline-block;
            width: 80px;
          }
          .section-title {
            background: #1e40af;
            color: white;
            padding: 6px 10px;
            margin: 10px 0 5px 0;
            font-size: 11px;
            font-weight: bold;
            border-radius: 3px;
            text-transform: uppercase;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 8px;
          }
          th {
            background: #3b82f6;
            color: white;
            padding: 5px;
            text-align: left;
            border: 1px solid #2563eb;
            font-size: 10px;
          }
          .totals-box {
            margin-left: auto;
            width: 250px;
            border: 2px solid #1e40af;
            border-radius: 4px;
            overflow: hidden;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            padding: 5px 10px;
            border-bottom: 1px solid #ddd;
            font-size: 11px;
          }
          .total-final {
            background: #1e40af;
            color: white;
            font-weight: bold;
            font-size: 14px;
            padding: 8px 10px;
            display: flex;
            justify-content: space-between;
          }
          .signatures {
            display: flex;
            margin-top: 15px;
            gap: 10px;
          }
          .signature-box {
            flex: 1;
            border: 1px solid #333;
            padding: 30px 8px 8px 8px;
            text-align: center;
            border-radius: 3px;
          }
          .signature-label {
            font-weight: bold;
            font-size: 8px;
            line-height: 1.2;
          }
          .notes-section {
            margin-top: 8px;
            padding: 8px;
            background: #fef3c7;
            border-left: 3px solid #f59e0b;
            border-radius: 3px;
            font-size: 9px;
          }
          @media print {
            body {
              padding: 10px;
            }
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 20px 40px;">
            <!-- Logo Sears a la izquierda -->
            ${this.logoSears ? `<img src="${this.logoSears}" alt="Sears" style="height: 65px; width: auto; object-fit: contain;">` : '<div style="width: 120px;"></div>'}

            <!-- Nombre del AutoCenter en el centro -->
            <div style="text-align: center; flex: 1; padding: 0 30px;">
              ${order.tienda ? `<h1 style="font-size: 28px; color: #1e40af; margin: 0; font-weight: 700; letter-spacing: 1px;">${order.tienda}</h1>` : ''}
              
            </div>

            <!-- Logo AutoCenter a la derecha -->
            ${this.logoAutoCenter ? `<img src="${this.logoAutoCenter}" alt="Auto Center" style="height: 65px; width: auto; object-fit: contain;">` : '<div style="width: 120px;"></div>'}
          </div>
        </div>

        <div class="folio-date">
          <strong>Fecha:</strong> ${today} | <strong>Folio:</strong> ${order.folio}
        </div>

        <!-- Información del Cliente -->
        <div class="info-section">
          <div style="font-weight: bold; color: #1e40af; margin-bottom: 4px; font-size: 11px;">DATOS DEL CLIENTE</div>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Nombre:</span>
              <span>${customer.nombre_completo}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Teléfono:</span>
              <span>${customer.telefono}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Dirección:</span>
              <span>${customer.direccion || 'N/A'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Ciudad:</span>
              <span>${customer.ciudad || 'N/A'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Centro Automoriz:</span>
              <span>${order.tienda}</span>
            </div>
            <div class="info-item">
              <span class="info-label">División:</span>
              <span>${order.division}</span>
            </div>
          </div>
        </div>

        <!-- Información del Vehículo -->
        <div class="info-section">
          <div style="font-weight: bold; color: #1e40af; margin-bottom: 4px; font-size: 11px;">DATOS DEL VEHÍCULO</div>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Marca:</span>
              <span>${vehicleInfo.brand || 'N/A'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Modelo:</span>
              <span>${vehicleInfo.model || 'N/A'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Año:</span>
              <span>${vehicleInfo.year || 'N/A'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Placas:</span>
              <span>${vehicleInfo.plate || 'N/A'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Kilometraje:</span>
              <span>${vehicleInfo.mileage || 'N/A'} km</span>
            </div>
            <div class="info-item">
              <span class="info-label">Color:</span>
              <span>${vehicleInfo.color || 'N/A'}</span>
            </div>
          </div>
        </div>

        ${productosAutorizadosRows ? `
          <div class="section-title">✓ Refacciones Autorizadas</div>
          <table>
            <thead>
              <tr>
                <th style="width: 30px; text-align: center;">#</th>
                <th>DESCRIPCIÓN</th>
                <th style="width: 50px; text-align: center;">CANT.</th>
                <th style="width: 80px; text-align: right;">PRECIO UNIT.</th>
                <th style="width: 80px; text-align: right;">IMPORTE TOTAL</th>
              </tr>
            </thead>
            <tbody>
              ${productosAutorizadosRows}
            </tbody>
          </table>
        ` : ''}

        ${(serviciosRows || authorizedAuthsRows) ? `
          <div class="section-title">🔧 Mano de Obra</div>
          <table>
            <thead>
              <tr>
                <th style="width: 30px; text-align: center;">#</th>
                <th>MANO DE OBRA</th>
                <th style="width: 50px; text-align: center;">CANT.</th>
                <th style="width: 80px; text-align: right;">PRECIO</th>
                <th style="width: 80px; text-align: right;">IMPORTE TOTAL</th>
              </tr>
            </thead>
            <tbody>
              ${serviciosRows || ''}${authorizedAuthsRows || ''}
            </tbody>
          </table>
        ` : ''}

        ${!isAuthorized && productosRecomendadosRows ? `
          <div class="section-title">📦 Refacciones Recomendadas</div>
          <table>
            <thead>
              <tr>
                <th style="width: 30px; text-align: center;">#</th>
                <th>DESCRIPCIÓN</th>
                <th style="width: 50px; text-align: center;">CANT.</th>
                <th style="width: 80px; text-align: right;">PRECIO UNIT.</th>
                <th style="width: 80px; text-align: right;">IMPORTE TOTAL</th>
              </tr>
            </thead>
            <tbody>
              ${productosRecomendadosRows}
            </tbody>
          </table>
        ` : ''}

        ${!isAuthorized && (pendingAuthsRows || diagnosticoRows) ? `
          <div class="section-title">🔍 Hallazgos y Recomendaciones</div>
          <table>
            <thead>
              <tr>
                <th style="width: 30px; text-align: center;">#</th>
                <th>HALLAZGO Y RECOMENDACIÓN</th>
                <th style="width: 100px; text-align: right;">IMPORTE TOTAL</th>
              </tr>
            </thead>
            <tbody>
              ${pendingAuthsRows}${diagnosticoRows}
            </tbody>
          </table>
        ` : ''}

        <div class="totals-box">
          ${subtotalProductos > 0 ? `
            <div class="total-row">
              <span>Subtotal Refacciones Autorizadas:</span>
              <span>$${subtotalProductos.toFixed(2)}</span>
            </div>
          ` : ''}
          ${(subtotalServicios > 0 || subtotalAuthorizedAuths > 0) ? `
            <div class="total-row">
              <span>Subtotal Mano de Obra:</span>
              <span>$${(subtotalServicios + subtotalAuthorizedAuths).toFixed(2)}</span>
            </div>
          ` : ''}
          ${!isAuthorized && (subtotalProductosRecomendados > 0 || subtotalDiagnostico > 0 || subtotalPendingAuths > 0) ? `
            <div class="total-row" style="color: #666; font-style: italic; font-size: 10px;">
              <span>Refacciones, Hallazgos y Recomendaciones (No incluidos en el total):</span>
              <span>$${(subtotalProductosRecomendados + subtotalDiagnostico + subtotalPendingAuths).toFixed(2)}</span>
            </div>
          ` : ''}
          <div class="total-final">
            <span>IMPORTE TOTAL:</span>
            <span>$${total.toFixed(2)}</span>
          </div>
        </div>

        <div class="signatures">
          <div class="signature-box">
            <div class="signature-label">AUTORIZO EL PRESUPUESTO</div>
          </div>
          <div class="signature-box">
            <div class="signature-label">AUTORIZO TRABAJOS BAJO MI RESPONSABILIDAD</div>
          </div>
          <div class="signature-box">
            <div class="signature-label">RECIBÍ A SATISFACCIÓN</div>
          </div>
        </div>

        <div class="notes-section">
          <strong>NOTA:</strong> Los precios pueden variar según disponibilidad, sin previo aviso.
        </div>
      </body>
      </html>
    `;
  }

  async printDiagnosticBudget(order: Order, customer: Customer): Promise<void> {
    await this.ensureLogosLoaded();
    const html = this.generateDiagnosticBudgetHTML(order, customer);
    const printWindow = window.open('', '_blank');

    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();

      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  }

  async downloadDiagnosticBudgetPDF(order: Order, customer: Customer): Promise<void> {
    try {
      await this.ensureLogosLoaded();
      const element = document.createElement('div');
      element.innerHTML = this.generateDiagnosticBudgetHTML(order, customer);
      element.style.width = '210mm';
      element.style.position = 'absolute';
      element.style.left = '-9999px';
      document.body.appendChild(element);

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        width: 794,
        windowWidth: 794
      });

      document.body.removeChild(element);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'letter'
      });

      const imgWidth = 210;
      const pageHeight = 279;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Presupuesto-${order.folio}.pdf`);
    } catch (error) {
      console.error('Error generando PDF:', error);
      alert('Error al generar el PDF. Por favor intente nuevamente o use la opción de imprimir.');
    }
  }
}
