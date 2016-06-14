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
		Social.ShowLeaderboardUI ();
	}


	public void SetSound()
	{
		if(soundToggle.isOn) {
			Globals.sound = true;
		} else {
			Globals.sound = false;
		}

		Debug.Log (Globals.sound);
	}

}