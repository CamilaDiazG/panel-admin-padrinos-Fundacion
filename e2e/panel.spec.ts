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
