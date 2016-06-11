/*
using UnityEngine;
using System.Collections;
using GooglePlayGames;
using GooglePlayGames.BasicApi;
using UnityEngine.SocialPlatforms;

public class TitleControl : MonoBehaviour {

	// Use this for initialization
	void Start () {
		PlayGamesClientConfiguration config = new PlayGamesClientConfiguration.Builder ()
			// enables saving game 
			//.EnableSavedGames()
			// registers a callback to handle game invitations received while the game is not running.
			//.WithInvitationDelegate(<callback method>)
			// registers a callback for turn based match notifications received while the
			// game is not running.
			//.WithMatchDelegate(<callback method>)
			// require access to a player's Google+ social graph (usually not needed)
			//.RequireGooglePlus()
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

	public void GiveAchievement(){
		Social.ReportProgress("CgkI363G7ewOEAIQAg", 100.0f, (bool success) => {
			// handle success or failure
			if (success){
				Debug.Log("Achievement unlocked 100 kills");
			}
			else {
				Debug.Log("Achievement unlock failed");
			}
		});	
	}

	public void ReportScore(){
		Social.ReportScore (1500, "CgkI363G7ewOEAIQAQ", (bool success) => {
			if (success) {
				Debug.Log ("Score submitted");
			} else {
				Debug.Log ("Score submit failed");
			}
		});
	}
}

*/