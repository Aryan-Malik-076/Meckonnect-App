import { MenuListProps, MenuListSection } from "@/@types";
import { menuStyles } from "@/components/styles";
import { colors, iconMap } from "@/constants";
import { useRouter } from "expo-router";
import { Image, Text, TouchableOpacity, View } from "react-native";

export const MenuList = ({ menuItems }: MenuListProps) => {
  const router = useRouter();

  return (
    <View style={menuStyles.menuListContainer}>
      {menuItems.map((section: MenuListSection, sectionIndex: number) => (
        <View key={sectionIndex} style={sectionIndex !== menuItems.length-1 && menuStyles.sectionContainer}>
          <Text style={menuStyles.sectionHeading}>{section.heading}</Text>
          <View style={{ borderColor: colors.border, borderRadius: 15, borderWidth: 1, padding: 5,shadowColor:colors.borderLight }}>
            {section.items.map((item, itemIndex) => (
              <TouchableOpacity
                key={itemIndex}
                onPress={() =>
                  router.push({ pathname: item.path as any, params: {} })
                }
                style={[
                  menuStyles.itemContainer,
                  itemIndex === section.items.length - 1 && menuStyles.noBorder,
                ]}
              >
                <Image
                  style={{ width: 18, height: 20, resizeMode: 'contain' }}
                  source={iconMap[item.icon] }
                />
                <View style={menuStyles.textContainer}>
                  <Text style={menuStyles.itemText}>{item.title}</Text>
                  {item.subtitle && (
                    <Text style={menuStyles.itemSubtitle}>{item.subtitle}</Text>
                  )}
                </View>
              <Image source={require('@/assets/images/right.png')} style={{ width: 8, height: 12, resizeMode: 'stretch' }} />
              </TouchableOpacity>
            ))}
          </View>

        </View>
      ))}
    </View>
  );
};
