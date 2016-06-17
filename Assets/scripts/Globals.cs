using UnityEngine;

public class Globals : MonoBehaviour 
{
	public static Globals GM;

	public static bool sound = true;

	public static int score = 0;
	public static int goldenStool = 0;

	public static int highScore = 0;

	public static int totalBugKills = 0;
	public static int totalGamesPlayed = 0;
	public static int totalShotsFired = 0;
	public static int totalHits = 0;

	public static int tempGameBugsKilled = 0;
	public static int tempShotsFired = 0;

	void Awake()
	{

		if(GM != null)
			GameObject.Destroy(GM);
		else
			GM = this;
		DontDestroyOnLoad(this);
	}
}