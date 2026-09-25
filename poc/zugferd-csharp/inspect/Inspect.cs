using System;
using System.Linq;
using System.Reflection;

class Program
{
    static void Main()
    {
        var assembly = Assembly.LoadFrom("/Users/aditya/.nuget/packages/balsoft.hive.einvoice/1.0.0/lib/net8.0/Balsoft.Hive.EInvoice.dll");
        Console.WriteLine("Assembly: " + assembly.FullName);
        Console.WriteLine();
        Console.WriteLine("Public types:");
        foreach (var type in assembly.GetTypes().Where(t => t.IsPublic && !t.Namespace?.StartsWith("<") == true).OrderBy(t => t.FullName))
        {
            Console.WriteLine($"  {type.FullName}");
            if (type.IsClass && !type.IsAbstract)
            {
                var ctors = type.GetConstructors(BindingFlags.Public | BindingFlags.Instance);
                if (ctors.Length > 0)
                {
                    Console.WriteLine($"    Constructors: {string.Join(", ", ctors.Select(c => $"({string.Join(", ", c.GetParameters().Select(p => $"{p.ParameterType.Name} {p.Name}"))}))")}");
                }
                var props = type.GetProperties(BindingFlags.Public | BindingFlags.Instance);
                if (props.Length > 0)
                {
                    Console.WriteLine($"    Properties: {string.Join(", ", props.Select(p => $"{p.PropertyType.Name} {p.Name}"))}");
                }
                var methods = type.GetMethods(BindingFlags.Public | BindingFlags.Instance | BindingFlags.DeclaredOnly)
                                .Where(m => !m.IsSpecialName)
                                .OrderBy(m => m.Name);
                if (methods.Length > 0)
                {
                    Console.WriteLine($"    Methods: {string.Join("; ", methods.Select(m => $"{m.ReturnType.Name} {m.Name}({string.Join(", ", m.GetParameters().Select(p => $"{p.ParameterType.Name} {p.Name}"))})")}");
                }
            }
        }
    }
}