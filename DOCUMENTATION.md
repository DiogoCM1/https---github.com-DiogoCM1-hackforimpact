## 🧾 Description
Este endpoint SOAP permite a sincronização periódica de artigos entre os sistemas M1 e Primavera. A funcionalidade recebe informações sobre artigos de um armazém específico, valida a existência dos artigos e armazéns, e insere os dados na tabela de sincronização do Primavera. Apenas artigos válidos e não anulados são processados, e logs são gerados para artigos ignorados e operações bem-sucedidas.

## 📡 Request
- **SOAP Action / HTTP Method**: POST
- **Content type**: text/xml

## 📦 Parameters
Lista de todos os parâmetros:
- **PkArmazem** (Guid) - Identificador único do armazém.
- **Artigos** (List\<Artigo\>) - Lista de artigos a serem sincronizados.
  - **PkArtigo** (Guid) - Identificador único do artigo.
  - **PkLote** (Guid?) - Identificador único do lote do artigo (opcional).
  - **Quantidade** (decimal) - Quantidade do artigo.

## 📥 Example request body
```xml
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:med="http://medicineone.net/">
   <soapenv:Header/>
   <soapenv:Body>
      <med:Stock_Armazens_Artigo_Lote_Quantidade_Sincronizar>
         <request>
            <PkArmazem>123e4567-e89b-12d3-a456-426614174000</PkArmazem>
            <Artigos>
               <Artigo>
                  <PkArtigo>123e4567-e89b-12d3-a456-426614174001</PkArtigo>
                  <PkLote>123e4567-e89b-12d3-a456-426614174002</PkLote>
                  <Quantidade>100</Quantidade>
               </Artigo>
            </Artigos>
         </request>
      </med:Stock_Armazens_Artigo_Lote_Quantidade_Sincronizar>
   </soapenv:Body>
</soapenv:Envelope>
```

## ✅ Common successful response
```xml
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
   <soapenv:Body>
      <Stock_Armazens_Artigo_Lote_Quantidade_SincronizarResponse>
         <IntegracaoResposta>
            <Success>true</Success>
            <Message>Sincronização concluída. 1 artigos inseridos na tabela de sincronização.</Message>
            <ArtigosProcessados>1</ArtigosProcessados>
            <ArtigosComAlteracoes>0</ArtigosComAlteracoes>
         </IntegracaoResposta>
      </Stock_Armazens_Artigo_Lote_Quantidade_SincronizarResponse>
   </soapenv:Body>
</soapenv:Envelope>
```

## ❌ Common error responses
```xml
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
   <soapenv:Body>
      <Stock_Armazens_Artigo_Lote_Quantidade_SincronizarResponse>
         <IntegracaoResposta>
            <Success>false</Success>
            <Message>Parâmetros inválidos: Request ou lista de artigos é nula/vazia.</Message>
         </IntegracaoResposta>
      </Stock_Armazens_Artigo_Lote_Quantidade_SincronizarResponse>
   </soapenv:Body>
</soapenv:Envelope>
```

```xml
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
   <soapenv:Body>
      <Stock_Armazens_Artigo_Lote_Quantidade_SincronizarResponse>
         <IntegracaoResposta>
            <Success>false</Success>
            <Message>Armazém não encontrado: 123e4567-e89b-12d3-a456-426614174000</Message>
         </IntegracaoResposta>
      </Stock_Armazens_Artigo_Lote_Quantidade_SincronizarResponse>
   </soapenv:Body>
</soapenv:Envelope>
```

```xml
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
   <soapenv:Body>
      <Stock_Armazens_Artigo_Lote_Quantidade_SincronizarResponse>
         <IntegracaoResposta>
            <Success>false</Success>
            <Message>Nenhum artigo válido encontrado para sincronização.</Message>
         </IntegracaoResposta>
      </Stock_Armazens_Artigo_Lote_Quantidade_SincronizarResponse>
   </soapenv:Body>
</soapenv:Envelope>
```