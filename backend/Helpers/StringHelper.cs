using System.Text.RegularExpressions;

namespace PolyBabyAPI.Helpers
{
    public static class StringHelper
    {
        public static string RemoveVietnameseTones(string text)
        {
            if (string.IsNullOrWhiteSpace(text))
                return text;

            text = Regex.Replace(text, "[àáạảãâầấậẩẫăằắặẳẵ]", "a");
            text = Regex.Replace(text, "[ÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴ]", "A");

            text = Regex.Replace(text, "[èéẹẻẽêềếệểễ]", "e");
            text = Regex.Replace(text, "[ÈÉẸẺẼÊỀẾỆỂỄ]", "E");

            text = Regex.Replace(text, "[ìíịỉĩ]", "i");
            text = Regex.Replace(text, "[ÌÍỊỈĨ]", "I");

            text = Regex.Replace(text, "[òóọỏõôồốộổỗơờớợởỡ]", "o");
            text = Regex.Replace(text, "[ÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠ]", "O");

            text = Regex.Replace(text, "[ùúụủũưừứựửữ]", "u");
            text = Regex.Replace(text, "[ÙÚỤỦŨƯỪỨỰỬỮ]", "U");

            text = Regex.Replace(text, "[ỳýỵỷỹ]", "y");
            text = Regex.Replace(text, "[ỲÝỴỶỸ]", "Y");

            text = Regex.Replace(text, "[đ]", "d");
            text = Regex.Replace(text, "[Đ]", "D");

            return text;
        }
    }
}
