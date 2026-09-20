/**
 * Banner de arranque A.L.N SYSTEM — referência Java (Swing / Server)
 * Use esta classe se migrar a interface para Java Swing no futuro.
 */
public final class Team
{
	private static final String RESET = "\u001B[0m";
	private static final String BOLD = "\u001B[1m";
	private static final String BRIGHT_CYAN = "\u001B[96m";
	private static final String BRIGHT_YELLOW = "\u001B[93m";
	private static final String BRIGHT_GREEN = "\u001B[92m";
	private static final String BRIGHT_MAGENTA = "\u001B[95m";

	private static final int LOGO_BANNER_WIDTH = 92;
	private static final String DOT_BORDER = repeat(':', LOGO_BANNER_WIDTH);
	private static final String VERSION = "1.0.0";
	private static final String AUTHOR = System.getenv().getOrDefault("ALN_AUTHOR", "A.L.N SYSTEM");
	private static final String ROLE = "Controle Financeiro Desktop / Meu Controle";

	private static final String[] LOGO_LINES =
	{
		" █████╗    ██╗     ███╗   ██╗    ███████╗██╗   ██╗███████╗████████╗███████╗███╗   ███╗",
		"██╔══██╗   ██║     ████╗  ██║    ██╔════╝╚██╗ ██╔╝██╔════╝╚══██╔══╝██╔════╝████╗ ████║",
		"███████║   ██║     ██╔██╗ ██║    ███████╗ ╚████╔╝ ███████╗   ██║   █████╗  ██╔████╔██║",
		"██╔══██║   ██║     ██║╚██╗██║    ╚════██║  ╚██╔╝  ╚════██║   ██║   ██╔══╝  ██║╚██╔╝██║",
		"██║  ██║   ███████╗██║ ╚████║    ███████║   ██║   ███████║   ██║   ███████╗██║ ╚═╝ ██║",
		"╚═╝  ╚═╝   ╚══════╝╚═╝  ╚═══╝    ╚══════╝   ╚═╝   ╚══════╝   ╚═╝   ╚══════╝╚═╝     ╚═╝"
	};

	private Team() {}

	public static void printLogo()
	{
		System.out.println(BRIGHT_CYAN + DOT_BORDER + RESET);
		for (String line : LOGO_LINES)
			System.out.println(BOLD + BRIGHT_CYAN + center(line, LOGO_BANNER_WIDTH) + RESET);
		System.out.println(BRIGHT_CYAN + DOT_BORDER + RESET);
		System.out.println(center(BOLD + BRIGHT_YELLOW + "[ A.L.N SYSTEM ]" + RESET + " " + BRIGHT_MAGENTA + "— " + ROLE + RESET, LOGO_BANNER_WIDTH));
		System.out.println(center(BRIGHT_GREEN + "Version " + VERSION + RESET + "  " + BRIGHT_CYAN + "|" + RESET + "  " + BRIGHT_YELLOW + "by " + AUTHOR + RESET, LOGO_BANNER_WIDTH));
		System.out.println(center(BRIGHT_MAGENTA + "Seu controle pessoal — sem planilha, 100% offline" + RESET, LOGO_BANNER_WIDTH));
		System.out.println(BRIGHT_CYAN + DOT_BORDER + RESET + "\n");
	}

	private static String repeat(char c, int n)
	{
		StringBuilder sb = new StringBuilder(n);
		for (int i = 0; i < n; i++) sb.append(c);
		return sb.toString();
	}

	private static String center(String text, int width)
	{
		int pad = Math.max(0, (width - text.replaceAll("\u001B\\[[0-9;]*m", "").length()) / 2);
		return " ".repeat(pad) + text;
	}

	public static void main(String[] args)
	{
		printLogo();
		System.out.println("  " + BRIGHT_GREEN + "✔ A.L.N SYSTEM — pronto" + RESET);
	}
}
