import React from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import i18n from "../app/i18n";
import { AudioPlayerProvider } from "../app/components/AudioPlayerProvider";

const AllProviders = ({ children }: { children: React.ReactNode }) => (
  <I18nextProvider i18n={i18n}>
    <AudioPlayerProvider>{children}</AudioPlayerProvider>
  </I18nextProvider>
);

export const renderWithProviders = (ui: React.ReactElement, options?: RenderOptions) =>
  render(ui, { wrapper: AllProviders, ...options });
