import { expect, test } from "@playwright/test";

test("permite entrar al modo demostración y consultar los tres reportes", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByAltText("Fundación Juntos por los Demás")).toBeVisible();
  await page.getByRole("button", { name: "Entrar a la demostración" }).click();
  await expect(page.getByRole("heading", { name: "Resumen del padrón" })).toBeVisible();
  if (await page.getByRole("button", { name: "Abrir menú" }).isVisible()) {
    await page.getByRole("button", { name: "Abrir menú" }).click();
  }
  await page.getByRole("link", { name: "Reportes" }).click();
  await expect(page.getByRole("tab")).toHaveCount(3);
  await page.getByRole("tab", { name: /Aportaciones/ }).click();
  await expect(page.getByText("Compromiso mensual equivalente")).toBeVisible();
});

test("registra y edita un padrino", async ({ page }) => {
  await page.goto("/padrinos/nuevo");
  await page.getByLabel("Nombre(s)").fill("Persona");
  await page.getByLabel("Apellido paterno").fill("Demostración");
  await page.getByLabel("Correo electrónico").fill(`demo-${Date.now()}@example.com`);
  await page.getByLabel("Teléfono", { exact: true }).fill("3312345678");
  await page.getByLabel("Código postal").fill("45019");
  await page.getByLabel("Aportación (MXN)").fill("750");
  await page.getByRole("button", { name: "Guardar padrino" }).click();
  await expect(page.getByText("Los cambios se guardaron correctamente.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Persona Demostración" })).toBeVisible();
});

test("filtra y registra un donativo", async ({ page }) => {
  await page.goto("/donativos");
  await expect(page.getByRole("heading", { name: "Control de donativos" })).toBeVisible();
  await expect(page.getByText("Acumulado recibido")).toBeVisible();
  await page.getByRole("button", { name: "Registrar donativo" }).click();
  await page.getByLabel("Padrino", { exact: true }).selectOption("demo-1");
  await page.getByLabel("Monto (MXN)").fill("1250");
  await page.getByLabel("Folio de transferencia").fill("E2E-TEST");
  await page.getByRole("button", { name: "Guardar donativo" }).click();
  await expect(page.getByText("El donativo se registró correctamente.")).toBeVisible();
  await expect(page.getByText("E2E-TEST")).toBeVisible();
});

test("guarda una carta navideña dentro del padrino", async ({ page }) => {
  await page.goto("/padrinos/demo-1");
  await expect(page.getByRole("heading", { name: "Cartas de Navidad" })).toBeVisible();
  await page.getByRole("button", { name: "Agregar carta" }).click();
  await page.getByLabel("Nombre del paciente").fill("Paciente de prueba");
  await page.getByLabel("Regalo 1").fill("Libro");
  await page.getByLabel("Regalo 2").fill("Rompecabezas");
  await page.getByLabel("Regalo 3").fill("Balón");
  await page.getByLabel("Carta escaneada").setInputFiles({
    name: "carta-prueba.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4 carta de prueba"),
  });
  await page.getByRole("button", { name: "Guardar carta" }).click();
  await expect(page.getByText("La carta y su archivo se guardaron correctamente.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Paciente de prueba" })).toBeVisible();
  await expect(page.getByText("carta-prueba.pdf")).toBeVisible();
});

test("hidrata sin errores cuando existen datos locales distintos", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    window.localStorage.setItem("juntos-padrinos-demo-v1", "[]");
    window.localStorage.setItem("juntos-donativos-demo-v1", "[]");
  });
  const hydrationErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" && message.text().includes("Hydration failed")) hydrationErrors.push(message.text());
  });
  await page.reload();
  await expect(page.getByRole("heading", { name: "Resumen del padrón" })).toBeVisible();
  await expect(page.getByText("0 activos")).toBeVisible();
  expect(hydrationErrors).toEqual([]);
});
