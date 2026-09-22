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
  await page.getByRole("button", { name: /Donativo monetario/ }).click();
  await page.getByLabel("Nombre(s)").fill("Persona");
  await page.getByLabel("Apellido paterno").fill("Demostración");
  await page.getByLabel("Correo electrónico").fill(`demo-${Date.now()}@example.com`);
  await page.getByLabel("Teléfono", { exact: true }).fill("3312345678");
  await page.getByLabel("Código postal").fill("45019");
  await page.getByLabel("Aportación (MXN)").fill("750");
  await page.getByRole("button", { name: "Guardar padrino" }).click();
  await expect(page.getByText("Los cambios se guardaron correctamente.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Persona Demostración", level: 1 })).toBeVisible();
});

test("registra un padrino de posada con donativo en especie", async ({ page }) => {
  await page.goto("/padrinos/nuevo");
  await page.getByRole("button", { name: /Padrino de posada/ }).click();
  await page.getByLabel("Nombre(s)").fill("Padrino");
  await page.getByLabel("Apellido paterno").fill("Posada");
  await page.getByLabel("Correo electrónico").fill(`posada-${Date.now()}@example.com`);
  await page.getByLabel("Teléfono", { exact: true }).fill("3312345678");
  await expect(page.getByLabel("Código postal")).toHaveCount(0);
  await expect(page.getByText("Donativo en especie único")).toBeVisible();
  await expect(page.getByLabel("Aportación (MXN)")).toHaveCount(0);
  await page.getByRole("button", { name: "Guardar padrino" }).click();
  await expect(page).toHaveURL(/\/posada/);
  await expect(page.getByRole("heading", { name: /Posada/ })).toBeVisible();
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

test("da de alta un ahijado de posada dentro del padrino", async ({ page }) => {
  await page.goto("/padrinos/demo-1?tab=posada");
  await expect(page.getByRole("heading", { name: "Ahijados de posada" })).toBeVisible();
  await page.getByRole("button", { name: "Dar de alta ahijado" }).click();
  await page.getByLabel("Nombre del ahijado").fill("Paciente de prueba");
  await page.getByLabel("Regalo 1").fill("Libro");
  await page.getByLabel("Regalo 2").fill("Rompecabezas");
  await page.getByLabel("Regalo 3").fill("Balón");
  await page.getByLabel("Carta escaneada").setInputFiles({
    name: "carta-prueba.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4 carta de prueba"),
  });
  await page.getByLabel("Confirmó que sí regalará").check();
  await page.getByRole("button", { name: "Guardar ahijado" }).click();
  await expect(page.getByText("El ahijado de posada se registró correctamente.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Paciente de prueba" })).toBeVisible();
  await expect(page.getByText("carta-prueba.pdf")).toBeVisible();
});

test("gestiona la campaña desde el tablero de posada", async ({ page }) => {
  await page.goto("/posada");
  await expect(page.getByRole("heading", { name: /Posada/ })).toBeVisible();
  await page.getByRole("button", { name: "Asignar ahijado" }).first().click();
  await page.getByLabel("Padrino", { exact: true }).selectOption("demo-1");
  await page.getByLabel("Nombre del ahijado").fill("Ahijado tablero");
  await page.getByLabel("Regalo 1").fill("Juego");
  await page.getByLabel("Regalo 2").fill("Libro");
  await page.getByLabel("Regalo 3").fill("Mochila");
  await page.locator(".posada-assignment-form").getByRole("button", { name: "Asignar ahijado" }).click();
  await expect(page.getByText("Ahijado asignado correctamente.")).toBeVisible();
  await expect(page.getByText("Ahijado tablero")).toBeVisible();
  await page.getByLabel("Ahijado tablero: confirmó que regalará").check();
  await expect(page.getByText("Confirmó que regalará")).toBeVisible();
});

test("da de alta rápidamente a un padrino y continúa con la asignación", async ({ page }) => {
  await page.goto("/posada");
  await page.getByRole("button", { name: "Nuevo padrino de posada" }).click();
  await page.getByLabel("Nombre completo").fill("Empleado Posada");
  await page.getByLabel("Teléfono").fill("3312340098");
  await page.getByRole("button", { name: "Guardar y asignar ahijado" }).click();
  await expect(page.getByText("Padrino registrado. Ahora asígnale su ahijado.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Asignar ahijado" })).toBeVisible();
  await expect(page.getByLabel("Padrino", { exact: true })).not.toHaveValue("");
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
