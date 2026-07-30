# Onde parei — Enterprise Suite

Última atualização: 30/07/2026

## Projeto atual

TracePass

## Concluído

- Docker e PostgreSQL configurados
- Banco funcionando na porta 5433
- Spring Boot funcionando na porta 8080
- Flyway configurado
- Tabela companies criada
- CRUD completo de empresas
- Validação dos dados recebidos
- Tratamento profissional de erros
- Proteção contra documento duplicado
- Testes automatizados do CompanyService
- Swagger/OpenAPI configurado
- Documentação visual das rotas
- CRUD testado manualmente
- Landing page do TracePass
- Dashboard empresarial
- Frontend conectado à API
- Indicadores de empresas
- Listagem visual de empresas
- Cadastro de empresas pelo frontend
- Exibição de erros de documento duplicado
- Build de produção do frontend validado
- Migração V2 da tabela products
- Entidade e repositório de produtos
- CRUD de produtos no backend
- Produtos documentados no Swagger
- Primeiro produto salvo no PostgreSQL
- Painel visual de produtos
- Cadastro de produtos pelo frontend
- Filtro de produtos por empresa
- Proteção contra SKU duplicado

## Rotas atuais

- POST /api/companies
- GET /api/companies
- GET /api/companies/{id}
- PUT /api/companies/{id}
- DELETE /api/companies/{id}

## Páginas locais

- Health: http://localhost:8080/actuator/health
- Swagger: http://localhost:8080/swagger-ui/index.html

## Próxima etapa

Criar o módulo de lotes vinculados aos produtos.