import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 10 : Math.max(insets.bottom, 8);
  return <Tabs screenOptions={{headerShown:false,tabBarActiveTintColor:"#C66BFF",tabBarInactiveTintColor:"#9B909E",tabBarButton:HapticTab,tabBarStyle:Platform.OS==="web"?{display:"none"}:{height:56+bottomPadding,paddingTop:7,paddingBottom:bottomPadding,backgroundColor:"#0C0A0E",borderTopColor:"#302833",borderTopWidth:0.5},tabBarLabelStyle:{fontSize:10,fontWeight:"700"}}}>
    <Tabs.Screen name="index" options={{title:"Today",tabBarIcon:({color})=><IconSymbol size={25} name="house.fill" color={color}/>}} />
    <Tabs.Screen name="log" options={{title:"Log",tabBarIcon:({color})=><IconSymbol size={24} name="list.bullet.clipboard" color={color}/>}} />
    <Tabs.Screen name="connect" options={{href:null}} />
    <Tabs.Screen name="steamy" options={{title:"Steamy",tabBarIcon:({color})=><IconSymbol size={24} name="heart.fill" color={color}/>}} />
    <Tabs.Screen name="memories" options={{title:"Photos",tabBarIcon:({color})=><IconSymbol size={24} name="photo.on.rectangle.angled" color={color}/>}} />
  </Tabs>;
}
