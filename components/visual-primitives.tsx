import { Platform } from "react-native";
import {
  StyleSheet,
  Text as NativeText,
  TextInput as NativeTextInput,
  TouchableOpacity as NativeTouchableOpacity,
  View as NativeView,
  type TextInputProps,
  type TextProps,
  type TouchableOpacityProps,
  type ViewProps,
} from "react-native";

import { useLocalJournal } from "@/lib/local-journal";
import { type FontPlatform, fontFamilyFor, normalizeGlobalBorderColor, normalizeGlobalFont, normalizeGlobalTextColor } from "@/lib/typography";

function useSharedVisualSettings() {
  const { theme, customSubheadings } = useLocalJournal();
  const fontFamily = fontFamilyFor(normalizeGlobalFont(theme.fontId ?? customSubheadings.globalFont), Platform.OS as FontPlatform);
  return {
    textColor: normalizeGlobalTextColor(theme.fontColor),
    borderColor: normalizeGlobalBorderColor(theme.borderColor),
    fontFamily,
  };
}

function withSharedBorder(style: unknown, borderColor: string) {
  const flat = StyleSheet.flatten(style as never) as Record<string, unknown> | undefined;
  const hasBorder = Boolean(flat && ["borderWidth", "borderTopWidth", "borderRightWidth", "borderBottomWidth", "borderLeftWidth"].some((key) => Number(flat[key] ?? 0) > 0));
  return hasBorder ? [style, { borderColor, borderTopColor: borderColor, borderRightColor: borderColor, borderBottomColor: borderColor, borderLeftColor: borderColor }] : style;
}

export function VisualText({ style, ...props }: TextProps) {
  const { textColor, fontFamily } = useSharedVisualSettings();
  return <NativeText {...props} style={[style, { color: textColor, fontFamily }]} />;
}

export function VisualTextInput({ style, ...props }: TextInputProps) {
  const { textColor, fontFamily, borderColor } = useSharedVisualSettings();
  return <NativeTextInput {...props} placeholderTextColor={textColor} style={[withSharedBorder(style, borderColor) as TextInputProps["style"], { color: textColor, fontFamily }]} />;
}

export function VisualView({ style, ...props }: ViewProps) {
  const { borderColor } = useSharedVisualSettings();
  return <NativeView {...props} style={withSharedBorder(style, borderColor) as ViewProps["style"]} />;
}

export function VisualTouchableOpacity({ style, ...props }: TouchableOpacityProps) {
  const { borderColor } = useSharedVisualSettings();
  return <NativeTouchableOpacity {...props} style={withSharedBorder(style, borderColor) as TouchableOpacityProps["style"]} />;
}
