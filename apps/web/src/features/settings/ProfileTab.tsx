import { useState, type FormEvent } from "react";
import type { Theme } from "@myplanner/shared";
import { useAuth } from "../../stores/auth-store";
import { useTheme } from "../../stores/theme-store";
import { useUpdateProfile } from "../../hooks/useUsers";
import { Field } from "../../components/ui/Field";
import { Input, Select } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { getApiErrorMessage } from "../../lib/api";

export function ProfileTab() {
  const { user, refreshUser } = useAuth();
  const { setTheme } = useTheme();
  const updateProfile = useUpdateProfile();
  const [name, setName] = useState(user?.name ?? "");
  const [theme, setThemeValue] = useState<Theme>(user?.theme ?? "SYSTEM");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    try {
      await updateProfile.mutateAsync({ name, theme });
      setTheme(theme);
      await refreshUser();
      setMessage("Perfil atualizado.");
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-4">
      <Field label="Nome">
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label="E-mail">
        <Input value={user?.email ?? ""} disabled />
      </Field>
      <Field label="Tema">
        <Select value={theme} onChange={(e) => setThemeValue(e.target.value as Theme)}>
          <option value="SYSTEM">Automático (sistema)</option>
          <option value="LIGHT">Claro</option>
          <option value="DARK">Escuro</option>
        </Select>
      </Field>
      {message && <p className="text-sm text-green-600 dark:text-green-400">{message}</p>}
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <Button type="submit" disabled={updateProfile.isPending}>
        {updateProfile.isPending ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
}
