import { formatCurrency, formatDate } from './constants';

interface Company {
  trade_name: string;
  company_name: string;
  cnpj: string;
  municipal_registration?: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  phone: string;
  email: string;
}

interface Customer {
  name: string;
  document: string;
  address: string;
  city: string;
  state: string;
  email?: string;
}

interface Product {
  sequence_number: number;
  description: string;
  quantity: number;
  unit: string;
  unit_value: number;
  total_value: number;
}

interface Invoice {
  nfe_number: string;
  nfe_series: number;
  nfe_key?: string;
  nfe_type: 'service' | 'product';
  issue_date: string;
  service_description?: string;
  service_total: number;
  liquid_value: number;
  iss_value?: number;
  operation_nature?: string;
  cfop?: string;
  payment_method?: string;
  status: string;
}

export function generateInvoicePDF(
  invoice: Invoice,
  company: Company,
  customer: Customer,
  products?: Product[]
): string {
  const isProduct = invoice.nfe_type === 'product';
  const title = isProduct ? 'NF-e - Nota Fiscal Eletrônica' : 'NFS-e - Nota Fiscal de Serviço Eletrônica';

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - ${invoice.nfe_number}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Arial', sans-serif;
      font-size: 11px;
      line-height: 1.4;
      color: #000;
      padding: 20px;
      background: #fff;
    }

    .container {
      max-width: 800px;
      margin: 0 auto;
      border: 2px solid #000;
      padding: 10px;
    }

    .header {
      text-align: center;
      border-bottom: 2px solid #000;
      padding-bottom: 10px;
      margin-bottom: 10px;
    }

    .header h1 {
      font-size: 18px;
      margin-bottom: 5px;
      font-weight: bold;
    }

    .header .subtitle {
      font-size: 12px;
      color: #666;
      margin-bottom: 10px;
    }

    .info-box {
      border: 1px solid #000;
      padding: 8px;
      margin-bottom: 10px;
    }

    .info-box h3 {
      font-size: 12px;
      font-weight: bold;
      margin-bottom: 5px;
      background: #f0f0f0;
      padding: 4px;
      border-bottom: 1px solid #000;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 3px;
    }

    .info-label {
      font-weight: bold;
      width: 40%;
    }

    .info-value {
      width: 60%;
    }

    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
    }

    table th,
    table td {
      border: 1px solid #000;
      padding: 6px;
      text-align: left;
    }

    table th {
      background: #f0f0f0;
      font-weight: bold;
      font-size: 10px;
    }

    table td {
      font-size: 10px;
    }

    .text-right {
      text-align: right;
    }

    .text-center {
      text-align: center;
    }

    .totals {
      margin-top: 10px;
      border-top: 2px solid #000;
      padding-top: 10px;
    }

    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 5px 0;
      font-size: 12px;
    }

    .total-row.final {
      font-size: 14px;
      font-weight: bold;
      border-top: 1px solid #000;
      margin-top: 5px;
      padding-top: 8px;
    }

    .barcode {
      text-align: center;
      padding: 15px;
      border: 1px solid #000;
      margin: 15px 0;
      background: #f9f9f9;
    }

    .barcode-number {
      font-family: 'Courier New', monospace;
      font-size: 14px;
      font-weight: bold;
      letter-spacing: 2px;
      margin-top: 10px;
    }

    .footer {
      margin-top: 20px;
      text-align: center;
      font-size: 10px;
      color: #666;
      border-top: 1px solid #ccc;
      padding-top: 10px;
    }

    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 4px;
      font-weight: bold;
      font-size: 11px;
    }

    .status-authorized {
      background: #10b981;
      color: #fff;
    }

    .status-draft {
      background: #94a3b8;
      color: #fff;
    }

    @media print {
      body {
        padding: 0;
      }

      .container {
        border: none;
        padding: 0;
      }

      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${title}</h1>
      <div class="subtitle">Documento Auxiliar da Nota Fiscal Eletrônica</div>
      <div class="subtitle">
        Nº ${invoice.nfe_number} - Série ${invoice.nfe_series}
        <span class="status-badge status-${invoice.status === 'authorized' ? 'authorized' : 'draft'}">
          ${invoice.status === 'authorized' ? 'AUTORIZADA' : 'RASCUNHO'}
        </span>
      </div>
      <div class="subtitle">
        Data de Emissão: ${formatDate(invoice.issue_date)}
      </div>
    </div>

    <div class="grid">
      <div class="info-box">
        <h3>EMITENTE</h3>
        <div class="info-row">
          <span class="info-label">Razão Social:</span>
          <span class="info-value">${company.company_name}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Nome Fantasia:</span>
          <span class="info-value">${company.trade_name}</span>
        </div>
        <div class="info-row">
          <span class="info-label">CNPJ:</span>
          <span class="info-value">${company.cnpj}</span>
        </div>
        ${company.municipal_registration ? `
        <div class="info-row">
          <span class="info-label">Inscrição Municipal:</span>
          <span class="info-value">${company.municipal_registration}</span>
        </div>
        ` : ''}
        <div class="info-row">
          <span class="info-label">Endereço:</span>
          <span class="info-value">${company.address}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Cidade/UF:</span>
          <span class="info-value">${company.city}/${company.state}</span>
        </div>
        <div class="info-row">
          <span class="info-label">CEP:</span>
          <span class="info-value">${company.zip_code}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Telefone:</span>
          <span class="info-value">${company.phone}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Email:</span>
          <span class="info-value">${company.email}</span>
        </div>
      </div>

      <div class="info-box">
        <h3>DESTINATÁRIO / TOMADOR</h3>
        <div class="info-row">
          <span class="info-label">Nome / Razão Social:</span>
          <span class="info-value">${customer.name}</span>
        </div>
        <div class="info-row">
          <span class="info-label">CPF / CNPJ:</span>
          <span class="info-value">${customer.document}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Endereço:</span>
          <span class="info-value">${customer.address}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Cidade/UF:</span>
          <span class="info-value">${customer.city}/${customer.state}</span>
        </div>
        ${customer.email ? `
        <div class="info-row">
          <span class="info-label">Email:</span>
          <span class="info-value">${customer.email}</span>
        </div>
        ` : ''}
      </div>
    </div>

    ${isProduct && products && products.length > 0 ? `
    <div class="info-box">
      <h3>PRODUTOS / SERVIÇOS</h3>
      <table>
        <thead>
          <tr>
            <th class="text-center">#</th>
            <th>Descrição</th>
            <th class="text-center">Qtd</th>
            <th class="text-center">Un</th>
            <th class="text-right">Valor Unit.</th>
            <th class="text-right">Valor Total</th>
          </tr>
        </thead>
        <tbody>
          ${products.map(product => `
            <tr>
              <td class="text-center">${product.sequence_number}</td>
              <td>${product.description}</td>
              <td class="text-center">${product.quantity}</td>
              <td class="text-center">${product.unit}</td>
              <td class="text-right">${formatCurrency(product.unit_value)}</td>
              <td class="text-right">${formatCurrency(product.total_value)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    ` : ''}

    ${!isProduct && invoice.service_description ? `
    <div class="info-box">
      <h3>DISCRIMINAÇÃO DO SERVIÇO</h3>
      <p style="padding: 10px; white-space: pre-wrap;">${invoice.service_description}</p>
    </div>
    ` : ''}

    <div class="info-box">
      <h3>DADOS ADICIONAIS</h3>
      ${invoice.operation_nature ? `
      <div class="info-row">
        <span class="info-label">Natureza da Operação:</span>
        <span class="info-value">${invoice.operation_nature}</span>
      </div>
      ` : ''}
      ${invoice.cfop ? `
      <div class="info-row">
        <span class="info-label">CFOP:</span>
        <span class="info-value">${invoice.cfop}</span>
      </div>
      ` : ''}
      ${invoice.payment_method ? `
      <div class="info-row">
        <span class="info-label">Forma de Pagamento:</span>
        <span class="info-value">${invoice.payment_method}</span>
      </div>
      ` : ''}
    </div>

    <div class="totals">
      <div class="total-row">
        <span>Valor Total Bruto:</span>
        <span>${formatCurrency(invoice.service_total)}</span>
      </div>
      ${invoice.iss_value ? `
      <div class="total-row">
        <span>ISS (5%):</span>
        <span>${formatCurrency(invoice.iss_value)}</span>
      </div>
      ` : ''}
      <div class="total-row final">
        <span>VALOR TOTAL DA NOTA:</span>
        <span>${formatCurrency(invoice.liquid_value)}</span>
      </div>
    </div>

    ${invoice.nfe_key ? `
    <div class="barcode">
      <div style="font-size: 12px; font-weight: bold; margin-bottom: 5px;">CHAVE DE ACESSO</div>
      <div class="barcode-number">${invoice.nfe_key}</div>
      <div style="margin-top: 10px; font-size: 10px; color: #666;">
        Consulte a autenticidade deste documento no portal da SEFAZ
      </div>
    </div>
    ` : ''}

    <div class="footer">
      <p>Documento emitido por ArsølUp - Sistema de Gestão</p>
      <p>Este documento é uma representação simplificada da Nota Fiscal Eletrônica</p>
    </div>

    <div class="no-print" style="text-align: center; margin-top: 20px;">
      <button onclick="window.print()" style="padding: 10px 30px; font-size: 14px; cursor: pointer; background: #10b981; color: white; border: none; border-radius: 6px; font-weight: bold;">
        Imprimir / Salvar PDF
      </button>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export function openPDFWindow(htmlContent: string): void {
  const printWindow = window.open('', '_blank', 'width=800,height=600');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }
}
