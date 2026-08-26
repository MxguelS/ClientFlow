import { describe, expect, it } from "vitest";

import { filterCommands, normalizeQuery, type CommandItem } from "@/lib/command/filter";

const commands: CommandItem[] = [
	{ id: "dashboard", label: "Ir al dashboard", keywords: ["inicio home"] },
	{ id: "settings", label: "Abrir ajustes", keywords: ["configuración preferencias"] },
	{ id: "logout", label: "Cerrar sesión", keywords: ["salir logout"] },
];

describe("command filter", () => {
	it("normaliza mayúsculas y acentos", () => {
		expect(normalizeQuery("  Configuración  ")).toBe("configuracion");
	});

	it("devuelve todos los comandos sin búsqueda", () => {
		expect(filterCommands(commands, "")).toHaveLength(3);
	});

	it("encuentra por etiqueta y keywords", () => {
		expect(filterCommands(commands, "ajustes")[0]?.id).toBe("settings");
		expect(filterCommands(commands, "logout")[0]?.id).toBe("logout");
	});

	it("prioriza coincidencia por prefijo", () => {
		const result = filterCommands([
			{ id: "one", label: "Abrir ajustes" },
			{ id: "two", label: "Ajustes rápidos" },
		], "ajustes");
		expect(result[0]?.id).toBe("two");
	});

	it("requiere que todas las palabras coincidan", () => {
		expect(filterCommands(commands, "ir dashboard")[0]?.id).toBe("dashboard");
		expect(filterCommands(commands, "facturas inexistentes")).toEqual([]);
	});
});
