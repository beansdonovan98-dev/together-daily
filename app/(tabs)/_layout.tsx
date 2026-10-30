import { Tabs } from "expo-router";
import { IconSymbol } from "@/components/ui/icon-symbol";

export default function TabLayout() {
  return <Tabs screenOptions={{headerShown:false,tabBarStyle:{display:"none"}}}>
    <Tabs.Screen name="index" options={{title:"Today",tabBarIcon:({color})=><IconSymbol size={25} name="house.fill" color={color}/>}} />
    <Tabs.Screen name="log" options={{title:"Log",tabBarIcon:({color})=><IconSymbol size={24} name="list.bullet.clipboard" color={color}/>}} />
    <Tabs.Screen name="health" options={{title:"Health",tabBarIcon:({color})=><IconSymbol size={24} name="heart.fill" color={color}/>}} />
  <Tabs.Screen name="nba" options={{title:"NBA",tabBarIcon:({color})=><IconSymbol size={24} name="sportscourt.fill" color={color}/>}} />
  <Tabs.Screen name="halloween-editor" options={{title:"Halloween Editor",tabBarIcon:({color})=><IconSymbol size={24} name="camera.fill" color={color}/>}} />
  <Tabs.Screen name="crash-reports" options={{title:"Crash Reports",tabBarIcon:({color})=><IconSymbol size={24} name="exclamationmark.triangle.fill" color={color}/>}} />
    <Tabs.Screen name="connect" options={{href:null}} />
    <Tabs.Screen name="steamy" options={{title:"Steamy",tabBarIcon:({color})=><IconSymbol size={24} name="heart.fill" color={color}/>}} />
    <Tabs.Screen name="memories" options={{href:null}} />
    <Tabs.Screen name="purchases" options={{title:"Purchase",tabBarIcon:({color})=><IconSymbol size={24} name="list.bullet.clipboard" color={color}/>}} />
    <Tabs.Screen name="cleaning" options={{title:"Cleaning",tabBarIcon:({color})=><IconSymbol size={24} name="list.bullet.clipboard" color={color}/>}} />
    <Tabs.Screen name="calendar" options={{title:"Calendar",tabBarIcon:({color})=><IconSymbol size={24} name="heart.fill" color={color}/>}} />
    <Tabs.Screen name="themes" options={{title:"Themes",tabBarIcon:({color})=><IconSymbol size={24} name="heart.fill" color={color}/>}} />
    <Tabs.Screen name="days" options={{title:"Past Days",tabBarIcon:({color})=><IconSymbol size={24} name="list.bullet.clipboard" color={color}/>}} />
  </Tabs>;
}
