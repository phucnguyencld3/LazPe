using System;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace PolyBabyAPI.Helpers
{
    public class CustomDateTimeConverter : JsonConverter<DateTime>
    {
        public override DateTime Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            return DateTime.Parse(reader.GetString()!);
        }

        public override void Write(Utf8JsonWriter writer, DateTime value, JsonSerializerOptions options)
        {
            if (value.Kind == DateTimeKind.Unspecified)
            {
                var localOffset = TimeZoneInfo.Local.GetUtcOffset(DateTime.UtcNow);
                if (localOffset == TimeSpan.Zero)
                {
                    value = DateTime.SpecifyKind(value, DateTimeKind.Utc);
                }
                else
                {
                    value = DateTime.SpecifyKind(value, DateTimeKind.Local);
                }
            }

            if (value.Kind == DateTimeKind.Utc)
            {
                writer.WriteStringValue(value.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"));
            }
            else
            {
                writer.WriteStringValue(value.ToString("yyyy-MM-ddTHH:mm:ss.fffzzz"));
            }
        }
    }
}
