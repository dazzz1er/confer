<?php namespace DJB\Confer\Http\Requests;

use App\Http\Requests\Request;

class InviteParticipantsRequest extends Request {

	/**
	 * Determine if the user is authorized to make this request.
	 *
	 * @return bool
	 */
	public function authorize()
	{
		return true;
	}

	/**
	 * Get the validation rules that apply to the request.
	 *
	 * @return array
	 */
	public function rules()
	{
		return [
			'conversation_name' => 'required_with:name_is_required|min:3',
			'invited_users.0' => 'required'
		];
	}

	public function messages()
	{
	    return [
	        'conversation_name.required_with' => 'A name is required, and must be at least 3 characters long',
	        'invited_users.0.required' => 'You have not invited anyone!',
	    ];
	}

}