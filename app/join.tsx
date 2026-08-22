import { Redirect, useLocalSearchParams } from "expo-router";

export default function RoomInviteRedirect() {
  const { roomCode, partner } = useLocalSearchParams<{ roomCode?: string; partner?: string }>();
  const code = typeof roomCode === "string" ? roomCode : "";
  const selectedPartner = partner === "beans" ? "beans" : "princess";

  return <Redirect href={{ pathname: "/", params: { roomCode: code, partner: selectedPartner } } as never} />;
}
