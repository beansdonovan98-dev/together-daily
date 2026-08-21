import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 10 : Math.max(insets.bottom, 8);
  return <Tabs screenOptions={{headerShown:false,tabBarActiveTintColor:"#8D5BA6",tabBarInactiveTintColor:"#8B818F",tabBarButton:HapticTab,tabBarStyle:{height:56+bottomPadding,paddingTop:7,paddingBottom:bottomPadding,backgroundColor:colors.background,borderTopColor:"#E8DEE9",borderTopWidth:0.5},tabBarLabelStyle:{fontSize:10,fontWeight:"700"}}}>
    <Tabs.Screen name="index" options={{title:"Today",tabBarIcon:({color})=><IconSymbol size={25} name="house.fill" color={color}/>}} />
    <Tabs.Screen name="log" options={{title:"Log",tabBarIcon:({color})=><IconSymbol size={24} name="list.bullet.clipboard" color={color}/>}} />
    <Tabs.Screen name="connect" options={{title:"Connect",tabBarIcon:({color})=><IconSymbol size={24} name="heart.fill" color={color}/>}} />
    <Tabs.Screen name="memories" options={{title:"Photos",tabBarIcon:({color})=><IconSymbol size={24} name="photo.on.rectangle.angled" color={color}/>}} />
    <Tabs.Screen name="chat" options={{title:"Chat",tabBarIcon:({color})=><IconSymbol size={24} name="bubble.left.and.bubble.right.fill" color={color}/>}} />
  </Tabs>;
}
