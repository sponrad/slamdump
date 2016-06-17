using UnityEngine;
using System.Collections;
using UnityEngine.UI;
//using GooglePlayGames;
//using GooglePlayGames.BasicApi;
using UnityEngine.SocialPlatforms;


public class SlamDumpControl : MonoBehaviour {

	public GameObject pooPrefab;
	public GameObject[] enemyPrefabs;
	public Text scoreText;
	public Text goldenStoolText;
	public GameObject rewardBug;

	public float rewardBugChance = 0.1f;

	public bool gameRunning = true;

	public float startSpawnDelayCeiling = 2f;
	public float endSpawnDelayCeiling = 0.25f;
	public int endSpawnCeilingDelayScore = 200;  //used for scaling the endspawn ceiling, when the score is this the delay will be end value

	private Bounds waterBounds;
	private Collider2D waterCollider;

	// Use this for initialization
	void Start () {
		Globals.score = 0;
		Globals.tempGameBugsKilled = 0;
		Globals.tempShotsFired = 0;

		//start a timer for creating roaches
		Invoke("SpawnEnemy", 2f);
		gameRunning = true;

		waterCollider = GameObject.Find ("WaterCollider").GetComponent<Collider2D> ();
		waterBounds = waterCollider.bounds;
	}

	// Update is called once per frame
	void Update () {
		//check for mousedown to spawn projectile
		if (Input.GetMouseButtonDown (0) && gameRunning) {
			Vector3 worldPos = Camera.main.ScreenToWorldPoint(Input.mousePosition);
			worldPos.z = -1f;
			float pooSpawnx = Random.Range (-10f, 10f);
			GameObject instance = Instantiate (pooPrefab, new Vector3(pooSpawnx, 10f, -1f), Quaternion.identity) as GameObject;
			instance.GetComponent<PooControl> ().target = worldPos;
		}

		//update Score
		//GameObject.Find("ScoreText").GetComponent<Text>().\
		scoreText.text = Globals.score.ToString();
		goldenStoolText.text = Globals.goldenStool.ToString ();
	}
    
	void SpawnEnemy(){
		//chance to spawn a rewardBug
		if (Random.value < rewardBugChance) {
			//SpawnRewardBug ();
		}

		float x = 0;
		float y = 0;
		do {
			x = UnityEngine.Random.Range(waterBounds.center.x - waterBounds.extents.x, waterBounds.center.x + waterBounds.extents.x);
			y = UnityEngine.Random.Range(waterBounds.center.y - waterBounds.extents.y, waterBounds.center.y + waterBounds.extents.y);
		} while (!waterCollider.OverlapPoint(new Vector2(x, y)) );

		float delay = 1f;

		//need to document this
		//delay is decreasing in relation to the score increasing, and based on the two ceilings
		/*if (Globals.score < endSpawnCeilingDelayScore) {
			delay = Random.value * (startSpawnDelayCeiling - ((startSpawnDelayCeiling - endSpawnDelayCeiling) * (Globals.score / 100f) ));
		} else {
			delay = Random.value * endSpawnDelayCeiling;
		}*/

		delay = Random.value * 4f;
		//spawn count factor returns an integer based on a sine function, negative numbers are ignored later on
		int spawnCountFactor = Mathf.CeilToInt( 0.05f * Globals.score * Mathf.Sin (0.4f * Mathf.Pow (Globals.score, 0.85f)));
		//Debug.Log (spawnCountFactor);
					
		if (gameRunning) {
			Instantiate (enemyPrefabs [Random.Range (0, enemyPrefabs.Length)], new Vector3 (x, y, -1f), Quaternion.identity);
			for (int i = 0; i < spawnCountFactor; i++) {
				Instantiate (enemyPrefabs [Random.Range (0, enemyPrefabs.Length)], new Vector3 (x, y, -1f), Quaternion.identity);
			}
			Invoke ("SpawnEnemy", delay);
		}

		//Time.timeSinceLevelLoad
	}

	void SpawnRewardBug(){
		float x = 0;
		float y = 0;
		do {
			x = UnityEngine.Random.Range(waterBounds.center.x - waterBounds.extents.x, waterBounds.center.x + waterBounds.extents.x);
			y = UnityEngine.Random.Range(waterBounds.center.y - waterBounds.extents.y, waterBounds.center.y + waterBounds.extents.y);
		} while (!waterCollider.OverlapPoint(new Vector2(x, y)) );

		Instantiate (rewardBug, new Vector3 (x, y, -1f), Quaternion.identity);
	}
}
