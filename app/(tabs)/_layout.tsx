import { Tabs } from "expo-router";
import { IconSymbol } from "@/components/ui/icon-symbol";

export default function TabLayout() {
  return <Tabs screenOptions={{headerShown:false,tabBarStyle:{display:"none"}}}>
    <Tabs.Screen name="index" options={{title:"Today",tabBarIcon:({color})=><IconSymbol size={25} name="house.fill" color={color}/>}} />
    <Tabs.Screen name="log" options={{title:"Log",tabBarIcon:({color})=><IconSymbol size={24} name="list.bullet.clipboard" color={color}/>}} />
    <Tabs.Screen name="days" options={{title:"Pages",tabBarIcon:({color})=><IconSymbol size={24} name="list.bullet.clipboard" color={color}/>}} />
    <Tabs.Screen name="habits" options={{title:"Habits",tabBarIcon:({color})=><IconSymbol size={24} name="heart.fill" color={color}/>}} />
    <Tabs.Screen name="connect" options={{href:null}} />
    <Tabs.Screen name="steamy" options={{title:"Steamy",tabBarIcon:({color})=><IconSymbol size={24} name="heart.fill" color={color}/>}} />
    <Tabs.Screen name="memories" options={{title:"Photos",tabBarIcon:({color})=><IconSymbol size={24} name="photo.on.rectangle.angled" color={color}/>}} />
  </Tabs>;
}
