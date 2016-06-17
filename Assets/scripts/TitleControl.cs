using UnityEngine;
using UnityEngine.UI;
using System.Collections;
using GooglePlayGames;
using GooglePlayGames.BasicApi;
using UnityEngine.SocialPlatforms;

public class TitleControl : MonoBehaviour {

	public Toggle soundToggle;

	// Use this for initialization
	void Start () {

		loadPlayerPrefs ();


		PlayGamesClientConfiguration config = new PlayGamesClientConfiguration.Builder ()
			.Build();

		GooglePlayGames.PlayGamesPlatform.InitializeInstance(config);
		// recommended for debugging:
		PlayGamesPlatform.DebugLogEnabled = true;
		// Activate the Google Play Games platform
		PlayGamesPlatform.Activate();

		Social.localUser.Authenticate((bool success) => {
			if (success){
				Debug.Log("Logged in");
			}
			else {
				Debug.Log("Login Failed");
			}
		});
				
	}
	
	// Update is called once per frame
	void Update () {
	}

	public void ShowLeaderboard(){
		PlayGamesPlatform.Instance.ShowLeaderboardUI (scripts.GPGIds.leaderboard_high_score);
	}


	public void SetSound()
	{
		//set the global val for later checks
		if(soundToggle.isOn) {
			Globals.sound = true;
			PlayerPrefs.SetInt ("sound", 1);
		} else {
			Globals.sound = false;
			PlayerPrefs.SetInt ("sound", 0);
		}
		PlayerPrefs.Save ();

	}

	public void loadPlayerPrefs(){
		//get it from prefs, set pref if not set
		if (!PlayerPrefs.HasKey("sound")) {
			PlayerPrefs.SetInt ("sound", 1);
			PlayerPrefs.Save ();
		}

		//prefs should be set no matter what here
		if (PlayerPrefs.GetInt("sound") == 1){
			soundToggle.isOn = true;
			Globals.sound = true;
		}
		else{
			soundToggle.isOn = false;
			Globals.sound = false;
		}

		if (PlayerPrefs.HasKey ("goldenStool")) {
			Globals.goldenStool = PlayerPrefs.GetInt ("goldenStool");
		}

		if (PlayerPrefs.HasKey ("totalBugKills")) {
			Globals.totalBugKills = PlayerPrefs.GetInt ("goldenStool");
		}

		if (PlayerPrefs.HasKey ("totalGamesPlayed")) {
			Globals.totalGamesPlayed = PlayerPrefs.GetInt ("totalGamesPlayed");
		}

		if (PlayerPrefs.HasKey ("totalShotsFired")) {
			Globals.totalShotsFired = PlayerPrefs.GetInt ("totalShotsFired");
		}

		if (PlayerPrefs.HasKey ("totalHits")) {
			Globals.totalHits = PlayerPrefs.GetInt ("totalHits");
		}
		if (PlayerPrefs.HasKey ("highScore")) {
			Globals.highScore = PlayerPrefs.GetInt ("highScore");
		}

		PlayerPrefs.Save ();

	}

}